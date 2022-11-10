const base = 'http://localhost:8080/tsp/api'

export const get = async endpoint => {
  let options = {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  }
  let r = await fetch(base + endpoint, options)

  return await r.json()
}

export const post = async (endpoint, body)=> {
  let options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  }
  let r = await fetch(base + endpoint, options)

  return await r.json()
}
