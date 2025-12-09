import axios from 'axios';

export const API = axios.create({
  baseURL: 'http://52.66.252.52:5000'
});
