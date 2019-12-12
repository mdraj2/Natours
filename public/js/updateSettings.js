// updatefunction
import axios from 'axios';
import { showAlert } from './alerts';

export const updateData = async (name, email) => {
  //Send the request through axios to the updateMe route
  //Note that in forms we dont have put/patch method
  try {
    const res = await axios({
      method: 'PATCH',
      url: 'http://127.0.0.1:3000/api/v1/users/updateMe',
      data: {
        name,
        email
      }
    });
    //
    if (res.data.status === 'success') {
      showAlert('success', 'Data updated successfully!');
    }
  } catch (err) {
    showAlert('error', err.response.data.message);
  }
};
