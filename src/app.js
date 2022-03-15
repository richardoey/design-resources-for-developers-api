const express = require("express");

const app = express();
const port = process.env.PORT || 3000;
const fetch = require("node-fetch");

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
        web: webTitle,
        url: urlLink,
        description: description,
      };
    }
  }
};

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

app.get("/markdown", async (req, res) => {
  return res.status(200).send({ markdown: await fetchReadme() });
});

app.get("/all", async (req, res) => {
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

  let allArr = [];

  if (tableOfContent) {
    let index = 0;
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

      let websiteTable = md.slice(webIndexArr[index], backToTopIndexArr[index]);
      let websiteRows = websiteTable.split("\n");
      let websiteArr = [];
      for (let i = 1; i < websiteRows.length - 1; i++) {
        if (getRowData(websiteRows[i])) {
          websiteArr.push(getRowData(websiteRows[i]));
        }
      }
      index++;
      return allArr.push({
        category: arr,
        description: description,
        resources: websiteArr,
      });
    });
    return res.status(200).send(allArr);
  }

  return res.status(200).send({ all: null });
});

app.get("/categories", async (req, res) => {
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
    return res.status(200).send(tableOfContentArr);
  }
  return res.status(200).send({ categories: null });
});

app.get("/category/:categoryName/all", async (req, res) => {
  // * Find the string index of Table of Contents
  let categoryName = req.params.categoryName;
  let resourcesArr = [];

  const md = await fetchReadme();
  const websiteTableIndex = md.indexOf(`${categoryName}\n\n`);

  if (websiteTableIndex > 0) {
    const backToTopRegex = /Back To Top+/g;

    const backToTopIndex = md.slice(websiteTableIndex).indexOf(backToTopRegex);

    let index = 0;
    const headingDelimiter = `## ${categoryName}\n\n>`;
    const delimiterLength = headingDelimiter.length;
    let headingStart = md.indexOf(headingDelimiter);

    let headingEnd = md.slice(headingStart + delimiterLength).indexOf("\n\n|");

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
        index++;
      }
    }

    resourcesArr.push({
      category: categoryName,
      description: description,
      resources: {
        count: index,
        websites: websiteArr,
      },
    });

    return res.status(200).send({ result: resourcesArr });
  }

  return res.status(200).send({ all: null });
});

app.get("/random", async (req, res) => {
  // * Call /all function
  await fetch("http://localhost:3000/all").then((res) => {
    let randomCategory;
  });

  return res.status(200).send({ all: null });
});
