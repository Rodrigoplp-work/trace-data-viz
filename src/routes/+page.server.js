import * as api from '$lib/api';

export async function load({ fetch, params }) {
  const files = await api.get('/experiments')
  console.log('params', params);

  // const res = await fetch(`/api/items/${params.id}`);
  // const res = await fetch('${APP_API_URL}/${params.endpoint}', options)
  // const item = await res.json();

  return { files };
}

/*
export const get = async endpoint => {
  let options = {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  }
  let r = await fetch(APP_API_URL + endpoint, options)

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
  let r = await fetch(APP_API_URL + endpoint, options)

  return await r.json()
}
*/
