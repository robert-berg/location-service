const {MongoClient, ObjectId} = require('mongodb');
const bcrypt = require('bcrypt');

// Replace DB_USER, DB_USER_PASSWD, DB_NAME here:
const db_user = /* TODO: Add your db user */'';
const db_pswd = /* TODO: Add your db password */'';
const db_name = /* TODO: Add your db name */'';
const dbHostname = /* TODO: Add your db hostname */'';
const dbPort = 27017;
const uri = `mongodb://${db_user}:${db_pswd}@${dbHostname}:${dbPort}/${db_name}`;

function MongoCRUDs(db_name, uri) {
  this.db_name = db_name;
  this.uri = uri;
}

MongoCRUDs.prototype.findOneUser = async function (uNameIn, passwdIn) {
  const client = new MongoClient(this.uri);
  try {
    const database = client.db(this.db_name);
    const users = database.collection('Users');
    const user = await users.findOne({username: uNameIn});

    if (user && (await bcrypt.compare(passwdIn, user.password))) {
      delete user.password; // Remove password before returning the user object
      return user;
    } else {
      return null; // User not found or password does not match
    }
  } finally {
    await client.close();
  }
};

MongoCRUDs.prototype.findAllUsers = async function () {
  const client = new MongoClient(uri);
  try {
    const database = client.db(db_name);
    const users = database.collection('Users');
    const query = {};
    const cursor = users.find(query);
    // Print a message if no documents were found
    if ((await users.countDocuments(query)) === 0) {
      console.log('No documents found!');
      return null;
    }
    let docs = new Array();
    for await (const doc of cursor) {
      delete doc.password;
      docs.push(doc);
    }
    return docs;
  } finally {
    // Ensures that the client will close when finished and on error
    await client.close();
  }
};

MongoCRUDs.prototype.createLocation = async function (locationData) {
  const client = new MongoClient(this.uri);
  try {
    await client.connect();
    const database = client.db(this.db_name);
    const locations = database.collection('Locations');

    const result = await locations.insertOne(locationData);
    if (result.acknowledged) {
      return result.insertedId; // Return the ID of the new location
    } else {
      throw new Error('Location creation failed');
    }
  } catch (error) {
    console.error('Error in createLocation:', error);
    throw error; // Re-throw the error for calling function to handle
  } finally {
    await client.close();
  }
};

MongoCRUDs.prototype.readLocations = async function () {
  const client = new MongoClient(this.uri);
  try {
    await client.connect();
    const database = client.db(this.db_name);
    const locations = database.collection('Locations');

    const cursor = locations.find({});
    const results = await cursor.toArray();

    if (results.length === 0) {
      console.log('No locations found');
      return [];
    } else {
      return results; // Return all locations
    }
  } catch (error) {
    console.error('Error in readLocations:', error);
    throw error; // Re-throw the error for calling function to handle
  } finally {
    await client.close();
  }
};

MongoCRUDs.prototype.readLocation = async function (id) {
  const client = new MongoClient(this.uri);
  try {
    await client.connect();
    const database = client.db(this.db_name);
    const locations = database.collection('Locations');

    // `id` is the string of the ObjectId
    const objectId = new ObjectId(id);
    const location = await locations.findOne({_id: objectId});

    if (!location) {
      console.log('Location not found');
      return null;
    } else {
      return location; // Return the found location
    }
  } catch (error) {
    console.error('Error in readLocation:', error);
    throw error; // Re-throw the error for calling function to handle
  } finally {
    await client.close();
  }
};

MongoCRUDs.prototype.updateLocation = async function (id, updateData) {
  const client = new MongoClient(this.uri);
  try {
    await client.connect();
    const database = client.db(this.db_name);
    const locations = database.collection('Locations');

    delete updateData._id;

    // `id` is the string of the ObjectId
    const objectId = new ObjectId(id);

    const result = await locations.updateOne(
      {_id: objectId},
      {$set: updateData}
    );

    if (result.matchedCount === 0) {
      console.log('No matching location found');
      return {success: false, message: 'No matching location found'};
    } else {
      return {
        success: true,
        message: 'Location updated successfully',
        result: result,
      };
    }
  } catch (error) {
    console.error('Error in updateLocation:', error);
    throw error; // Re-throw the error for calling function to handle
  } finally {
    await client.close();
  }
};

MongoCRUDs.prototype.deleteLocation = async function (id) {
  console.log(id);
  const client = new MongoClient(this.uri);
  try {
    await client.connect();
    const database = client.db(this.db_name);
    const locations = database.collection('Locations');

    // `id` is the string of the ObjectId
    const objectId = new ObjectId(id);

    const result = await locations.deleteOne({_id: objectId});

    if (result.deletedCount === 0) {
      console.log('No matching location found');
      return {success: false, message: 'No matching location found'};
    } else {
      return {success: true, message: 'Location deleted successfully'};
    }
  } catch (error) {
    console.error('Error in deleteLocation:', error);
    throw error; // Re-throw the error for calling function to handle
  } finally {
    await client.close();
  }
};

const mongoCRUDs = new MongoCRUDs(db_name, uri);

module.exports = mongoCRUDs;
