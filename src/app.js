const express = require('express')
const app = express()
const port = process.env.PORT || 3000
const fetch = require('node-fetch')

const fetchReadme = async () => {
    const githubURL = "https://raw.githubusercontent.com/bradtraversy/design-resources-for-developers/master/readme.md"
    const response = await fetch(githubURL)
    const data = await response.text()

    return data
}

const getRowData = (text) => {
    const webStartIndex = text.indexOf('[')
    const webEndIndex = text.indexOf(']')
    const webTitle = text.splice(webStartIndex + 1, webEndIndex - 1)

    const urlStartIndex = text.splice(webEndIndex).indexOf('(')
    const urlEndIndex = text.splice(webEndIndex).indexOf(')')
    const urlLink = text.splice(urlStartIndex + 1, urlEndIndex - 1)

    const descStartIndex = text.splice(urlEndIndex).indexOf("|")
    const descEndIndex = text.splice(urlEndIndex).indexOf("|\n|")
    const description = text.splice(descStartIndex + 1, descEndIndex - 1).trim()

    return {
        "web": webTitle,
        "url": urlLink,
        "description": description
    }

}

app.listen(port, () => {
    console.log(`Server running on port ${port}`)
})

app.get("/markdown", async (req, res) => {
    return res.status(200).send({ "markdown": await fetchReadme() })
})

app.get("/all", async (req, res) => {
    // * Find the string index of Table of Contents 
    const md = await fetchReadme()
    const tableOfContentIndex = md.indexOf("Table of Contents")

    // * Find the index of first Content (defined by using \n\n##)
    const contentIndex = md.slice(tableOfContentIndex).indexOf("\n\n##")

    // * Regex for retrieving Table of Content
    const tableOfContent = md.slice(tableOfContentIndex, tableOfContentIndex + contentIndex).match(/\[(.+?)\]/g)
    const allArr = []

    if (tableOfContent) {
        tableOfContent.forEach((arr) => {
            arr = arr.replace("[", "").replace("]", "")
            const headingDelimiter = `## ${arr}\n\n>`
            const delimiterLength = headingDelimiter.length
            const headingStart = md.indexOf(headingDelimiter)

            const headingEnd = md.slice(headingStart + delimiterLength).indexOf('Back to Top')

            const oneCategory = md.slice(headingStart + delimiterLength, headingStart + delimiterLength + headingEnd)
            
            // TODO : Make a row retrieve function and call getRowData() function
            
            return tableOfContentArr.push({
                "category": arr,
                "description": oneCategory
            })
        })
        return res.status(200).send(allArr)
    }

    return res.status(200).send({ "all": null })

})

app.get('/categories', async (req, res) => {

    // * Find the string index of Table of Contents 
    const md = await fetchReadme()
    const tableOfContentIndex = md.indexOf("Table of Contents")

    // * Find the index of first Content (defined by using \n\n##)
    const contentIndex = md.slice(tableOfContentIndex).indexOf("\n\n##")

    // * Regex for retrieving Table of Content
    const tableOfContent = md.slice(tableOfContentIndex, tableOfContentIndex + contentIndex).match(/\[(.+?)\]/g)

    const tableOfContentArr = []

    // * If found
    if (tableOfContent) {
        tableOfContent.forEach((arr) => {
            arr = arr.replace("[", "").replace("]", "")
            const headingDelimiter = `## ${arr}\n\n>`
            const delimiterLength = headingDelimiter.length
            const headingStart = md.indexOf(headingDelimiter)

            const headingEnd = md.slice(headingStart + delimiterLength).indexOf('\n\n|')

            const description = md.slice(headingStart + delimiterLength, headingStart + delimiterLength + headingEnd)

            return tableOfContentArr.push({
                "category": arr,
                "description": description
            })
        })
        return res.status(200).send(tableOfContentArr)
    }
    return res.status(200).send({ "categories": null })
})

