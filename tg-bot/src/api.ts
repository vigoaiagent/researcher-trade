import axios from 'axios';

// 创建不使用代理的 axios 实例
export const api = axios.create({
  proxy: false,
  timeout: 10000,
});
