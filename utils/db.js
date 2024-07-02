import mongodb from 'mongodb';

class DBClient {
  constructor() {
    const host = process.env.DB_HOST || 'localhost';
    const port = process.env.DB_PORT || 27017;
    const database = process.env.DB_DATABASE || 'files_manager';
    const dbURL = `mongodb://${host}:${port}/${database}`;

    this.client = new mongodb.MongoClient(dbURL, { useUnifiedTopology: true });
    this.client.connect()
      .then(() => {
        this.db = this.client.db(database);
      }).catch((err) => {
        console.log(err);
      });
  }

  isAlive() {
    return this.client.isConnected();
  }

  async nbUsers() {
    const returnedValue = await this.db.collection('users').countDocuments();
    return returnedValue;
  }

  async nbFiles() {
    const returnedValue = await this.db.collection('users').countDocuments();
    return returnedValue;
  }
}

const dbClient = new DBClient();
module.exports = dbClient;
