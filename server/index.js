const express = require("express");
const app = express();

var query = `query Page($season: MediaSeason, $seasonYear: Int, $type: MediaType, $isAdult: Boolean, $page: Int) {
  Page(page: $page) {
    media(season: $season, seasonYear: $seasonYear, type: $type, isAdult: $isAdult) {
      averageScore
      coverImage {
        extraLarge
      }
      episodes
      endDate {
        year
        month
      }
      genres
      startDate {
        year
        month
      }
      studios {
        nodes {
          name
        }
      }
      title {
        english
        native
        romaji
      }
      description
    }
    pageInfo {
      currentPage
      hasNextPage
    }
  }
}`;

var variables = {
  season: "WINTER",
  seasonYear: 2023,
  type: "ANIME",
  isAdult: false,
  page: 1,
};

var animeOfTheDay = null; // Variable to store the selected anime of the day
var lastUpdated = new Date().toISOString(); // Initialize lastUpdated with the current date and time
var apiTries = 0; // Counter for API tries, we are limited to 30 a day

var seasons = ["WINTER", "SPRING", "SUMMER", "FALL"];
app.use(express.json()); // Middleware to parse JSON bodies

function isDifferentDay(date1, date2) {
  return (
    date1.getFullYear() !== date2.getFullYear() ||
    date1.getMonth() !== date2.getMonth() ||
    date1.getDate() !== date2.getDate()
  );
}

// Function to fetch data from AniList API
async function fetchAnimeData(query, variables) {
  const url = "https://graphql.anilist.co";
  const options = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      query: query,
      variables: variables,
    }),
  };

  try {
    const response = await fetch(url, options);
    const data = await response.json();

    if (response.ok) {
      console.log("Data fetched successfully");
      return data; // Return the JSON response
    } else {
      console.log("Error fetching data:", data);
      throw new Error("Failed to fetch data");
    }
  } catch (error) {
    console.log("Fetch error:", error);
    throw error;
  }
}

async function SelectRandomAnime(mediaArray) {
  const randomIndex = Math.floor(Math.random() * mediaArray.length);
  return mediaArray[randomIndex];
}

async function GetAllAnimePages(query, variables) {
  var randomYear = Math.floor(
    1962 + Math.pow(Math.random(), 0.48) * (2024 - 1962 + 1)
  );
  var randomSeason = seasons[Math.floor(Math.random() * seasons.length)];
  variables.seasonYear = randomYear;
  variables.season = randomSeason;
  var result = await fetchAnimeData(query, variables); // Use the new function
  while (result.data.Page.media.length == 0 && apiTries < 15) {
    apiTries++; // Increment the API tries counter
    console.log("No media found, trying again...");
    variables.page = 1; // Reset page to 1 for each new request
    randomYear = Math.floor(
      1962 + Math.pow(Math.random(), 0.48) * (2024 - 1962 + 1)
    );
    randomSeason = seasons[Math.floor(Math.random() * seasons.length)];
    variables.seasonYear = randomYear;
    variables.season = randomSeason;

    result = await fetchAnimeData(query, variables); // Retry fetching data if no media found
  }
  if (result.data.Page.pageInfo.hasNextPage) {
    console.log("Fetching additional pages...");
    while (result.data.Page.pageInfo.hasNextPage) {
      variables.page += 1; // Increment the page number
      const nextPageResult = await fetchAnimeData(query, variables); // Fetch the next page
      result.data.Page.media.push(...nextPageResult.data.Page.media); // Append the new media to the existing array
      result.data.Page.pageInfo = nextPageResult.data.Page.pageInfo; // Update pageInfo with the new data
    }
  }
  return result; // Return the complete result with all pages
}

app.get("/data", async (req, res) => {
  if (
    animeOfTheDay == null ||
    isDifferentDay(new Date(lastUpdated), new Date())
  ) {
    const minRating = Math.floor(Math.pow(Math.random(), 0.44) * 90); // Random popularity value
    currentRating = 0;
    console.log("Minimum Rating: ", minRating);

    apiTries = 0; //we are in a new day, reset the tries
    var englishName = null; // Reset the English name to make sure we get one
    variables.page = 1; // Reset page to 1 for each new request

    try {
      while (
        (currentRating < minRating || englishName == null) &&
        apiTries < 15
      ) {
        const result = await GetAllAnimePages(query, variables); // Fetch all pages of anime data
        animeOfTheDay = await SelectRandomAnime(result.data.Page.media); // Select a random anime from the result
        currentRating = animeOfTheDay.averageScore;
        englishName = animeOfTheDay.title.english; // Get the English name of the selected anime
        apiTries++; // Increment the API tries counter
      }
      console.log("Selected anime:", animeOfTheDay); // Log the selected anime
      res.json(animeOfTheDay); // Send the result back to the client
    } catch (error) {
      res.status(500).json({ error: "An error occurred" });
    }
  } else {
    console.log("Returning cached anime of the day");
    res.json(animeOfTheDay); // Return the cached anime of the day
  }
});

app.get("/test", async (req, res) => {
  console.log("Test endpoint hit");
  const testJson = {
    data: {
      Media: {
        averageScore: 50,
        coverImage: {
          medium:
            "https://s4.anilist.co/file/anilistcdn/media/anime/cover/small/bx98515-sSZiUx4VI0KH.png",
        },
        episodes: 12,
        endDate: {
          year: 2020,
          month: 6,
        },
        genres: ["Comedy", "Romance", "Supernatural"],
        startDate: {
          year: 2020,
          month: 1,
        },
        studios: {
          nodes: [
            { name: "Children's Playground Entertainment" },
            { name: "Bandai Namco Arts" },
            { name: "bilibili" },
            { name: "Funimation" },
            { name: "Shueisha" },
          ],
        },
        title: {
          english: "Hatena Illusion",
          native: "はてな☆イリュージョン",
          romaji: "Hatena☆Illusion",
        },
        description:
          "The series centers on Makoto Shiranui, a boy who travels to Tokyo seeking to become the apprentice of Mamoru Hoshisato, a world-famous magician and friend of his parents. Ever since he had watched a show by Mamoru and his wife Maive, he had dreamed of being a magician. Their daughter Kana (nicknamed Hatena) has been Makoto's friend since childhood. Even though Tokyo has had a rash of burglaries by a beautiful woman thief, Makoto can rest easy as long as Hatena is there. When he arrives at the Hoshisato residence, a haunted mansion, the family butler Jeeves and the maid Emma greet him, and he is reunited with Hatena, only to find out that they don't really get along now.<br><br>\n\n(Source: Anime News Network)",
      },
    },
  };

  res.json(testJson); // Send the JSON object as the response
});

app.listen(3000, () => {
  console.log("Server is running on http://localhost:3000");
});
