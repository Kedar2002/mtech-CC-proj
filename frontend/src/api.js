import axios from 'axios';

export const API = axios.create({
  baseURL: 'http://13.233.146.34:5000'
});
