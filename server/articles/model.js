const cnx = require('../connection');
const ObjectID = require('mongodb').ObjectID;
const utils = require('../common/utils');

const articles = Object.create({
    find,
    update,
    list,
    reset,
    getAllCategories,
    getAllPlaces
});

function renameProperty(obj, oldName, newName) {

    const getKey = key => key === oldName ? newName : key;

    return Object.keys(obj)
        .reduce((acc, currentKey) =>
                Object.assign(acc, {[getKey(currentKey)]: obj[currentKey]}),
            {}
        );
}

function renameId(article) {
    return renameProperty(article, '_id', 'id')
}

function renameIds(articles) {
    return articles.map(renameId);
}

function find(id) {
    return cnx.then(db =>
        db.collection('articles')
            .find({_id: new ObjectID(id)})
            .limit(1)
            .next()
            .then(renameId)
    );
}

function update(id, article) {
    return cnx.then(db =>
        db.collection('articles')
            .updateOne(
                {_id: new ObjectID(id)},
                {$set: article}
            )
    );
}

function list() {
    return cnx.then(db =>
        db.collection('articles')
            .find({})
            .toArray()
            .then(renameIds)
    );
}

function reset() {
    const mocks = require('./mocks.json')
        .map(({title, body, photoThumbnail, description, tags, place}) => ({
            title,
            body,
            photoThumbnail,
            description,
            tags,
            place
        }));

    const recreateDb = () =>
        cnx.then(db => db.collection('articles')
            .insertMany(mocks)
        );

    return cnx.then(db =>
        db.dropCollection('articles')
            .then(recreateDb, recreateDb)
    );
}

function getAllCategories() {

    const getTags = articles =>
        articles
            .map(({tags}) => tags)
            .reduce((prev, next) => prev.concat(next), [])
            .filter(utils.uniqVal);

    return list()
        .then(getTags);
}

function getAllPlaces () {
    const getPlaces = articles =>
        articles
            .map(({place}) => place)
            .filter(utils.uniqVal);

    return list().then(getPlaces);
}

module.exports = articles;

