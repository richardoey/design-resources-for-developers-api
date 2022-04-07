const express = require("express");
const cors = require("cors");
const config = require("../config.json");
const cookieParser = require("cookie-parser");

const app = express();
const port = process.env.PORT || 3000;
const fetch = require("node-fetch");

const whitelist = ["http://localhost:4000", "http://localhost/"];
const corsOptions = {
  origin: function (origin, callback) {
    if (whitelist.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
};

app.use(cookieParser());
app.use(express.json());
app.use(cors(corsOptions));

const fetchReadme = async () => {
  const githubURL =
    "https://raw.githubusercontent.com/bradtraversy/design-resources-for-developers/master/readme.md";
  const response = await fetch(githubURL);
  const readmeText = await response.text();

  return readmeText;
};

const getRowData = (text) => {
  // * text = | [WhatFont](https://chrome.google.com/webstore/detail/whatfont/jabopobgcpjmedljpbcaablpmlmfcogm) | The easiest way to identify fonts on web pages.|
  if (text) {
    const webStartIndex = text.indexOf("[");
    const webEndIndex = text.indexOf("]");
    const webTitle = text.slice(webStartIndex + 1, webEndIndex);

    const urlStartIndex = text.indexOf("(");
    const urlEndIndex = text.indexOf(")");
    const urlLink = text.slice(urlStartIndex + 1, urlEndIndex);

    const textSplit = text.split("|");
    if (textSplit[2] && textSplit[2].match(/([A-Za-z])\w+/g)) {
      const description = textSplit[2].trim();
      return {
        name: webTitle,
        link: urlLink,
        description: description,
      };
    }
  }
};

async function getEntries() {
  // * Find the string index of Table of Contents
  const md = await fetchReadme();
  const tableOfContentIndex = md.indexOf("Table of Contents");

  // * Find the index of first Content (defined by using \n\n##)
  const contentIndex = md.slice(tableOfContentIndex).indexOf("\n\n##");

  // * Regex for retrieving Table of Content
  const tableOfContent = md
    .slice(tableOfContentIndex, tableOfContentIndex + contentIndex)
    .match(/\[(.+?)\]/g);

  // * Regex for getting Website Table
  const webTableRegex = /Website&nbsp+/g;

  // * Put all of webTableRegex matched index into an array
  const webIndexArr = [];
  while ((match = webTableRegex.exec(md)) != null) {
    webIndexArr.push(match.index);
  }

  const backToTopRegex = /Back To Top+/g;

  // * Put all of backToTopRegex matched index into an array
  const backToTopIndexArr = [];
  while ((match = backToTopRegex.exec(md)) != null) {
    backToTopIndexArr.push(match.index);
  }

  let entriesArr = [];

  if (tableOfContent) {
    let index = 0;
    tableOfContent.forEach((arr) => {
      arr = arr.replace("[", "").replace("]", "");
      const headingDelimiter = `## ${arr}\n\n>`;
      const delimiterLength = headingDelimiter.length;

      let websiteTable = md.slice(webIndexArr[index], backToTopIndexArr[index]);
      let websiteRows = websiteTable.split("\n");
      for (let i = 1; i < websiteRows.length - 1; i++) {
        if (getRowData(websiteRows[i])) {
          let entry = getRowData(websiteRows[i]);
          entry["category"] = arr;
          entriesArr.push(entry);
        }
      }
      index++;
    });
    return {
      count: entriesArr.length,
      entries: entriesArr,
    };
  }

  return {
    code: "entries/not_found",
    message: "No entries are found",
  };
}

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

app.get(
  `/${config.prefix}/${config.version}/markdown`,
  cors(),
  async (req, res) => {
    return res.status(200).send({ markdown: await fetchReadme() });
  }
);

app.get(
  `/${config.prefix}/${config.version}/entries`,
  cors(),
  async (req, res) => {
    let result = await getEntries();
    if (!result.code) {
      return res.status(200).send(result);
    } else {
      return res.status(404).send({
        code: "entries/not_found",
        message: "No entries are found",
      });
    }
  }
);

app.get(
  `/${config.prefix}/${config.version}/categories`,
  cors(corsOptions),
  async (req, res) => {
    // * Find the string index of Table of Contents
    const md = await fetchReadme();
    const tableOfContentIndex = md.indexOf("Table of Contents");

    // * Find the index of first Content (defined by using \n\n##)
    const contentIndex = md.slice(tableOfContentIndex).indexOf("\n\n##");

    // * Regex for retrieving Table of Content
    const tableOfContent = md
      .slice(tableOfContentIndex, tableOfContentIndex + contentIndex)
      .match(/\[(.+?)\]/g);

    let tableOfContentArr = [];

    // * If found
    if (tableOfContent) {
      tableOfContent.forEach((arr) => {
        arr = arr.replace("[", "").replace("]", "");
        const headingDelimiter = `## ${arr}\n\n>`;
        const delimiterLength = headingDelimiter.length;
        let headingStart = md.indexOf(headingDelimiter);

        let headingEnd = md
          .slice(headingStart + delimiterLength)
          .indexOf("\n\n|");

        let description = md.slice(
          headingStart + delimiterLength,
          headingStart + delimiterLength + headingEnd
        );

        return tableOfContentArr.push({
          category: arr,
          description: description,
        });
      });
      return res.status(200).send({
        count: tableOfContentArr.length,
        categories: tableOfContentArr,
      });
    }
    return res.status(404).send({
      code: "categories/not_found",
      message: "No categories are found",
    });
  }
);

app.get(
  `/${config.prefix}/${config.version}/category/:categoryName`,
  cors(),
  async (req, res) => {
    // * Find the string index of Table of Contents
    let categoryName = req.params.categoryName;
    let resourcesArr = [];

    const md = await fetchReadme();
    const websiteTableIndex = md.indexOf(`${categoryName}\n\n`);

    if (websiteTableIndex > 0) {
      const backToTopRegex = "Back To Top";

      const backToTopIndex =
        websiteTableIndex + md.slice(websiteTableIndex).indexOf(backToTopRegex);
      const headingDelimiter = `## ${categoryName}\n\n>`;
      const delimiterLength = headingDelimiter.length;
      let headingStart = md.indexOf(headingDelimiter);

      let headingEnd = md
        .slice(headingStart + delimiterLength)
        .indexOf("\n\n|");

      let description = md.slice(
        headingStart + delimiterLength,
        headingStart + delimiterLength + headingEnd
      );

      let websiteTable = md.slice(md.indexOf(description), backToTopIndex);
      let websiteRows = websiteTable.split("\n");
      let websiteArr = [];
      for (let i = 3; i < websiteRows.length - 1; i++) {
        if (getRowData(websiteRows[i])) {
          websiteArr.push(getRowData(websiteRows[i]));
        }
      }

      return res.status(200).send({
        category: categoryName,
        description: description,
        entries: {
          count: websiteArr.length,
          websites: websiteArr,
        },
      });
    }

    return res.status(404).send({
      code: "categories/list/not_found",
      message: "No resources are found for this category",
    });
  }
);

app.get(
  `/${config.prefix}/${config.version}/random`,
  cors(),
  async (req, res) => {
    let result = await getEntries();
    let randomNum = (Math.random() * result.entries.length).toFixed(0);
    if (!result.code) {
      return res.status(200).send(result.entries[randomNum]);
    } else {
      return res.status(404).send({
        code: "random/not_found",
        message: "No random entry is found",
      });
    }
  }
);
