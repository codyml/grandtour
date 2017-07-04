/*
*   Imports
*/

const router = require('express').Router()
const { isAdministrator } = require('./auth')
const socketIO = require('../socket')
const google = require('googleapis')
const Revision = require('../models/revision')
const Entry = require('../models/entry')
const entryFields = require('../models/entry-fields')


/*
*   Exports the indicated revision to Google Sheets.
*/

router.post('/api/export/to-sheets', isAdministrator, (req, res, next) => {

    //  Sends HTTP response first so client doesn't re-attempt request
    res.json({ status: 200 })

    //  Kicks off async exporting process
    exportToSheets(req.body.revisionIndex)
    .catch(next)

})


/*
*   Sends progress updates to socket-connected clients.
*/

const sendUpdate = (message, progress) => {
    const { socket } = socketIO
    socket.emit('sheets-export', { message, progress })
    console.log(message) 
}


/*
*   Exports all entry values to a new Google Spreadsheet, returning
*   a link to the spreadsheet.
*/

const exportToSheets = async revisionIndex => {

    sendUpdate('Retrieving entries')
    const entries = await Entry.find().atRevision(revisionIndex)
    const sheets = saveEntriesToSheets(entries)
    await saveSheetsToGoogleSpreadsheet(sheets)

}


/*
*   Saves entries to an in-memory representation of a spreadsheet.
*/

const saveEntriesToSheets = entries => {

    sendUpdate('Formatting entries for spreadsheet')
    
    const sheets = createSheets()
    let nFormatted = 0
    entries.forEach(entry => {

        Object.values(entryFields).forEach(field => {

            const value = entry[field.key]
            if (value) {

                const sheet = sheets[field.sheet.name]
                const transform = field.sheet.toSheet || (d => d)

                //  For fields that accept an array of values
                if (Array.isArray(field.type)) {

                    const newRows = value.map(valueArrayElement => {

                        const row = []
                        row[sheet.header.indexOf('index')] = entry.index

                        //  For fields whose values are objects
                        if (field.sheet.columns) {

                            for (let key in valueArrayElement) {
                                row[sheet.header.indexOf(key)] = transform(valueArrayElement[key])
                            }

                        //  For fields whose values are primitives
                        } else row[sheet.header.indexOf(field.sheet.column)] = transform(valueArrayElement)

                        return row

                    })

                    sheet.rows = [ ...sheet.rows, ...newRows ]

                //  For fields that accept a single value
                } else {

                    let row = sheet.rows.filter(row => row[sheet.header.indexOf('index')] === entry.index)[0]
                    if (!row) {

                        row = []
                        row[sheet.header.indexOf('index')] = entry.index
                        sheet.rows = [ ...sheet.rows, row ]

                    }

                    //  For fields whose values are objects
                    if (field.sheet.columns) {

                        for (let key in value) {
                            row[sheet.header.indexOf(key)] = transform(value[key])
                        }

                    //  For fields whose values are primitives
                    } else row[sheet.header.indexOf(field.sheet.column)] = transform(value)

                }

            }

        })

        nFormatted++
        if (nFormatted % 1000 === 0) sendUpdate(`Formatted ${nFormatted} of ${entries.length} entries for spreadsheet`)

    })

    const sheetsArray = Object.values(sheets)
    sheetsArray.forEach(sheet => {

        sheet.rows.sort((a, b) => +a[0] > +b[0] ? 1 : (+b[0] > +a[0] ? -1 : 0))
        sheet.rows.unshift(sheet.header)
    
    })

    return sheetsArray

}


/*
*   Creates the spreadsheet sheets based on the field-to-sheet mappings
*   described in the entry field schemas.
*/

const createSheets = () => {

    const sheets = {}
    Object.values(entryFields).forEach(field => {

        if (!sheets[field.sheet.name]) {

            sheets[field.sheet.name] = {
                name: field.sheet.name,
                header: [ 'index' ],
                rows: [],
            }

        }

        const sheet = sheets[field.sheet.name]
        if (field.sheet.column) sheet.header = [ ...sheet.header, field.sheet.column ]
        else sheet.header = [ ...sheet.header, ...field.sheet.columns ]

    })

    return sheets

}


/*
*   Creates a new Google Spreadsheet containing the sheets of entry
*   fields.
*/

const saveSheetsToGoogleSpreadsheet = async sheets => {

    await authenticate()
    const spreadsheet = await createNewSpreadsheet(sheets)
    await setSpreadsheetPermissions(spreadsheet)
    sendUpdate(`Saving entry data to spreadsheet`)
    await Promise.all(sheets.map(sheet => saveToSheet(spreadsheet, sheet)))
    sendUpdate(`Export complete to spreadsheet ${spreadsheet.spreadsheetUrl}`)

}


/*
*   Returns a promise for authenticating with Google to access the
*   specified sheets.
*/

const authenticate = () => new Promise(resolve => {

    sendUpdate('Authenticating with Google')

    const scopes = ['https://www.googleapis.com/auth/drive']
    const email = process.env.SHEETS_EMAIL
    const key = process.env.SHEETS_PRIVATE_KEY.split('\\n').join('\n')

    const auth = new google.auth.JWT(email, null, key, scopes, null)
    auth.authorize(function (error, tokens) {
        
        if (error) { throw error }
        else {
            google.options({ auth })
            resolve()
        }
        
    });

})


/*
*   Returns a promise for creating a new Google spreadsheet, resolving
*   with the new Spreadsheet object.
*/

const createNewSpreadsheet = sheets => new Promise(resolve => {

    sendUpdate('Creating new Google Spreadsheet')
    
    const createSpreadsheetRequest = {
        resource: {
            properties: {
                title: `Grand Tour Explorer data, exported ${(new Date()).toLocaleString()}`,
            },
            sheets: sheets.map(sheet => ({
                properties: {
                    title: sheet.name,
                    gridProperties: {
                        frozenRowCount: 1,
                    }
                },
            })),
        }
    }

    google.sheets('v4').spreadsheets.create(createSpreadsheetRequest, (error, response) => {
        if (error) { throw error }
        else resolve(response)    
    })

})


/*
*   Sets the permissions on the newly-created Google Spreadsheet.
*/

const setSpreadsheetPermissions = spreadsheet => new Promise(resolve => {

    sendUpdate('Setting spreadsheet permissions')

    const setPermissionsRequest = {
        fileId: spreadsheet.spreadsheetId,
        resource: {
            role: 'writer',
            type: 'anyone',
        }
    }

    google.drive('v3').permissions.create(setPermissionsRequest, error => {
        if (error) { throw error }
        else resolve()
    })

})


/*
*   Saves a sheet rows to a new sheet on the Google Spreadsheet.
*/

const saveToSheet = async (spreadsheet, sheet) => {

    const insertDataRequest = {

        spreadsheetId: spreadsheet.spreadsheetId,
        range: `${sheet.name}!A1`,
        valueInputOption: 'RAW',
        resource: {
            values: sheet.rows,
        },

    }

    await new Promise(resolve => {

        google.sheets('v4').spreadsheets.values.update(insertDataRequest, error => {
            if (error) { throw error }
            else resolve()
        })

    })

    sendUpdate(`Saved entry data to sheet ${sheet.name}`)

}



/*
*   Exports
*/

module.exports = router
