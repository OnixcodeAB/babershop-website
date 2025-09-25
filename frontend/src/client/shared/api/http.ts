import axios from 'axios';
import { getApiBaseUrl } from '../config';

export const httpClient = axios.create({
  baseURL: getApiBaseUrl(),
});
