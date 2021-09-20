import 'module-alias/register';
import cacheLocal from './utils/cache';
import * as admin from 'firebase-admin';
import { KeyValObj, CollectionId, Collection, DBParams } from './utils/typings';

/**
 * @class
 * Exported main class
 */
class Database {
  private firestore: FirebaseFirestore.Firestore;
  private projectId: string;
  private cacheMaxAge: number;
  private cacheAllocatedMemory: number;

  /**
   * @param initParams
   */
  public constructor(initParams: DBParams) {
    this.projectId = initParams.serviceParams.projectId;
    this.cacheMaxAge = initParams.cacheMaxAge;
    this.cacheAllocatedMemory = initParams.cacheAllocatedMemory;
    admin.initializeApp({
      credential: admin.credential.cert(initParams.serviceParams),
      databaseURL: `https://${this.projectId}.firebaseio.com`,
    });
    this.firestore = admin.firestore();
  }
  /**
   * This method Writes to collection and cache
   * @param collectionId
   * @param document
   * @returns written collection
   */
  async write(collectionId: CollectionId, document: KeyValObj): Promise<any> {
    try {
      const { id, collection } = collectionId;
      cacheLocal.getInstance(this.cacheMaxAge, this.cacheAllocatedMemory).set(`${collection}-${id}`, document);
      await this.firestore
        .collection(collection)
        .doc(id)
        .set({ ...document });
      const doc = await this.readOne({ collection, id });
      if (!doc) {
        return Promise.reject({ error: { type: 'internal_server_error', message: 'Unable to write the document' } });
      }
      return Promise.resolve({ ...doc });
    } catch (err) {
      return Promise.reject({ error: err });
    }
  }

  /**
   * Reads a document from the collection based on the
   * collection and document id
   * @param readOneReq
   * @returns
   */
  async readOne(readOneReq: CollectionId): Promise<{}> {
    try {
      const { collection, id } = readOneReq;
      const object: object | undefined | null = cacheLocal
        .getInstance(this.cacheMaxAge, this.cacheAllocatedMemory)
        .get<object>(`${collection}-${id}`);
      if (!object) {
        const doc = await this.firestore.collection(collection).doc(id).get();
        if (!doc.exists) {
          return Promise.reject({ error: { type: 'internal_server_error', message: 'Doc does not exists' } });
        }
        return Promise.resolve({ ...doc.data() });
      } else {
        return Promise.resolve({ id, ...object });
      }
    } catch (err) {
      return Promise.reject({ error: err });
    }
  }

  /**
   * Reads docs from the collection base on filters
   * @param collection 
   * @param filters 
   * @param rateLimit 
   * @returns 
   */
  async readMany(
    collection: Collection,
    filters: KeyValObj | undefined | null,
    rateLimit?: number | undefined | null,
  ): Promise<any> {
    try {
      const allEntries: {}[] = [];
      let filteredEntries: {}[] = [];
      let querySnapshot: FirebaseFirestore.QuerySnapshot<FirebaseFirestore.DocumentData>;
      if (filters && Object.keys(filters).length) {
        querySnapshot = await this.firestore
          .collection(collection.collection)
          .where(Object.keys(filters)[0], '==', filters[Object.keys(filters)[0]])
          .limit(rateLimit || 10)
          .get();
      } else {
        querySnapshot = await this.firestore
          .collection(collection.collection)
          .limit(rateLimit || 10)
          .get();
      }

      querySnapshot.forEach((doc: any) => allEntries.push(doc.data()));
      if (filters && Object.keys(filters).length) {
        delete filters[Object.keys(filters)[0]];
        const filterKeys = Object.keys(filters);
        filteredEntries = allEntries.filter((item: any) => {
          // validates all filter criteria
          return filterKeys.every((key: string) => {
            return filters[key] === item[key];
          });
        });
        return Promise.resolve(filteredEntries);
      }
      return Promise.resolve(allEntries);
    } catch (err) {
      return Promise.reject({ error: err });
    }
  }
}

export default Database;
