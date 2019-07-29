var express = require("express");
//var MongoClient = require('mongodb').MongoClient;
var bodyParser = require("body-parser");
var app = express();
var _ = require("underscore")
let cityData = require('./cities.json')
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

//​/state/<state-name>/add/<city-name>
app.put('/state/:stateName/add/:cityName', function(req, res) {
    console.log("req" + req.url)
    var urlSplit = req.url.split("/")
    res.send({ "status": true })
    updateDatabase(urlSplit[4], urlSplit[2], 'INSERT')
});

app.delete('/state/:stateName/remove/:cityName', function(req, res) {
    console.log("req" + req.url)
    var urlSplit = req.url.split("/")
    updateDatabase(urlSplit[4], urlSplit[2], 'DELETE')
    res.send({ "delete Status": true })
})

var state_map = groupBy(cityData, 'state', 'name');
console.log("result" + state_map)

function updateDatabase(city, state, action) {
    console.log(city, state)
    fetchData(state, function(err, res) {
        var cityList = []
        if (!err) {
            if (action === 'DELETE') {
                cityList = _.without(res.cities, city);
                console.log("cityList" + cityList)
            } else if (action === 'INSERT') {
                console.log("res.cities" + typeof res.cities)
                cityList = res.cities;
                cityList.push(city)
                    //console.log("cityList" + cityList)
            }
            var query = { state: state };
            var newValue = { $set: { cities: cityList } };
            updateDate(query, newValue)
        } else {
            console.error("Error occured", +err)
        }
    })

}

var MongoClient = require('mongodb').MongoClient;
let data_base = undefined;
const COLLECTION_NAME = "Persons2"
MongoClient.connect("mongodb://localhost:27017/MyDatabase", (err, db) => {
    if (err) {
        console.log(`Failed to connect to the database. ${err.stack}`);
    } else {
        console.log("connection is success")
    }
    data_base = db;
    app.listen(3001, function() {
        console.log("Started on PORT 3001");
        clearDatabase(function() {
            insertJSONFile(state_map, function() {
                //fetchData("Odisha")
            })
        });


    })
});

function fetchData(key, cb) {
    var obj = { "state": key }
    data_base.collection(COLLECTION_NAME).findOne(obj, function(err, result) {
        //console.log("res" + JSON.stringify(result))
        if (err) cb(err, null)
        if (cb) cb(null, result)
    })
}

function updateDate(query, newValue) {
    console.log("update" + JSON.stringify(query))
    console.log("update" + JSON.stringify(newValue))
    data_base.collection(COLLECTION_NAME).updateOne(query, newValue, function(err, res) {
        if (err) throw err;
        console.log("1 document updated");
    });
}

function clearDatabase(cb) {
    data_base.dropCollection(COLLECTION_NAME, function(err, delOK) {
        //  if (err) throw err;
        if (delOK) console.log("Collection deleted");
        if (cb) cb()
    });
}


function insertJSONFile(state_map, cb) {
    data_base.createCollection(COLLECTION_NAME, function(err, result) {
        if (err) throw err;
        data_base.collection(COLLECTION_NAME, function(err, collection) {
            collection.insertMany(state_map, function(err, r) {
                data_base.collection(COLLECTION_NAME).count(function(err, count) {
                    if (err) throw err;
                    console.log('Total Rows: ' + count);
                    if (cb) cb()
                });
            });
        });
    });
}







function groupBy(dataToGroupOn, fieldNameToGroupOn, fieldNameForGroupName) {
    return _.chain(dataToGroupOn)
        .groupBy(fieldNameToGroupOn)
        .map(function(value, key) {
            return {
                state: key,
                cities: _.pluck(value, fieldNameForGroupName)
            }
        })
        .value();
}