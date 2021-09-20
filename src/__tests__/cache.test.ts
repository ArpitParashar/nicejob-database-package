import CacheLocal from '../utils/cache';

describe('Cache Local', function () {
    describe('get set', function () {
      it('should be get when data is set', function () {
        // this could be dumped onto the page from the server
    
          const userObj = {
            name: 'David',
            loggedInAt: 1421543590,
          };
  
        const cache = CacheLocal.getInstance(12,21);
        cache.set("1", userObj)
        expect(cache.get("1")).toEqual(userObj);
      });
    });
  });