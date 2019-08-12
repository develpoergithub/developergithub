export function useLocalStorage(store, key) {
  //console.log('imported useLocalStorage');
  const json = localStorage.getItem(key);
  if (json) {
    //console.log('got json');
    store.set(JSON.parse(json));
  }
  const unsubscribe = store.subscribe(current => {
    //console.log('storing...' + JSON.stringify(current));
    localStorage.setItem(key, JSON.stringify(current));
  });
}

export function useSessionStorage(store, key) {
  //console.log('imported useLocalStorage');
  const json = sessionStorage.getItem(key);
  if (json) {
    //console.log('got json');
    store.set(JSON.parse(json));
  }
  const unsubscribe = store.subscribe(current => {
    //console.log('storing...' + JSON.stringify(current));
    sessionStorage.setItem(key, JSON.stringify(current));
  });
}
