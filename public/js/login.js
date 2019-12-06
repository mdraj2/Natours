/* eslint-disable */

//async await can only be run on moderm browser

const login = async (email, password) => {
  try {
    const res = await axios({
      method: 'POST',
      url: 'http://127.0.0.1:3000/api/v1/users/login',
      data: {
        email,
        password
      }
    });

    if (res.data.stat === 'success') {
      alert('Logged in successfully');
      window.setTimeout(() => {
        location.assign('/');
      }, 1500);
    }
  } catch (err) {
    console.log(err.response.data.message);
  }
};

document.querySelector('.form').addEventListener('submit', e => {
  // this prevent loading of any page
  e.preventDefault();
  //get the values in the email and the passwoed
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  login(email, password);
});
