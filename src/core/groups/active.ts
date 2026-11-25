// Eszközönkénti állapot localStorage-ben (privát módban csendben nem ment).
function read(key: string) {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function write(key: string, value: string | null) {
  try {
    if (value === null) localStorage.removeItem(key)
    else localStorage.setItem(key, value)
  } catch {
    /* nem baj */
  }
}

export const readActiveGroup = () => read('banda.group')
export const setActiveGroup = (id: string) => write('banda.group', id)

// Meghívó link belépés előtt: login után ide térünk vissza
export const readPendingJoin = () => read('banda.join')
export const setPendingJoin = (code: string | null) => write('banda.join', code)
