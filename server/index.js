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
    while (result.data.Page.pageInfo.hasNextPage && apiTries < 15) {
      apiTries++; // Increment the API tries counter
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
    console.log("Fetching new anime of the day");
    console.log("Last updated: ", lastUpdated);
    console.log("Current date: ", new Date());
    console.log(JSON.stringify(animeOfTheDay));
    lastUpdated = new Date().toISOString(); // Update lastUpdated to the current date and time
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
    averageScore: 83,
    coverImage: {
      extraLarge:
        "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx30-AI1zr74Dh4ye.jpg",
    },
    episodes: 26,
    endDate: {
      year: 1996,
      month: 3,
    },
    genres: ["Action", "Drama", "Mecha", "Mystery", "Psychological", "Sci-Fi"],
    startDate: {
      year: 1995,
      month: 10,
    },
    studios: {
      nodes: [
        {
          name: "Gainax",
        },
        {
          name: "TV Tokyo",
        },
        {
          name: "ADV Films",
        },
        {
          name: "Kadokawa Shoten",
        },
        {
          name: "NAS",
        },
        {
          name: "Tatsunoko Production",
        },
        {
          name: "GKIDS",
        },
        {
          name: "Madman Entertainment",
        },
      ],
    },
    title: {
      english: "Neon Genesis Evangelion",
      native: "新世紀エヴァンゲリオン",
      romaji: "Shin Seiki Evangelion",
    },
    description:
      "In the year 2015, the Angels, huge, tremendously powerful, alien war machines, appear in Tokyo for the second time. The only hope for Mankind's survival lies in the Evangelion, a humanoid fighting machine developed by NERV, a special United Nations agency. Capable of withstanding anything the Angels can dish out, the Evangelion's one drawback lies in the limited number of people able to pilot them. Only a handful of teenagers, all born fourteen years ago, nine months after the Angels first appeared, are able to interface with the Evangelion. One such teenager is Shinji Ikari, whose father heads the NERV team that developed and maintains the Evangelion. Thrust into a maelstrom of battle and events that he does not understand, Shinji is forced to plumb the depths of his own inner resources for the courage and strength to not only fight, but to survive, or risk losing everything. <br><br>\n(Source: AniDB)<br>\n<br>\n <i>Note: Later releases include edited versions of Episodes 21-24 called the \"Director's Cut\" with some visual editing and adding extra scenes that appeared in the theatrical recap 'Death'.</i>",
  };

  res.json(testJson); // Send the JSON object as the response
});

app.listen(3000, () => {
  console.log("Server is running on http://localhost:3000");
});
