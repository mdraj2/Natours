/* eslint-disable */
import '@babel/polyfill';
import { login } from './login';
import { displayMap } from './mapbox';

//DOM ELements
const mapBox = document.getElementById('map');
const loginForm = document.querySelector('.form');
//Values

if (mapBox) {
  const locations = JSON.parse(mapBox.dataset.locations);
  displayMap(locations);
}

if (loginForm) {
  loginForm.addEventListener('submit', e => {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    // this prevent loading of any page
    e.preventDefault();
    //get the values in the email and the passwoed
    login(email, password);
  });
}
