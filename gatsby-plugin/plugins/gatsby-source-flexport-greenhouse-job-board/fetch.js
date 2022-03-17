const axios = require("axios");

const baseUrl = `https://boards-api.greenhouse.io/v1/boards`;

async function fetchJobs(boardToken) {
  const url = `${baseUrl}/${boardToken}/jobs/`;
  const jobs = await getJobs(url);
  return jobs;
}

async function fetchOffices(boardToken) {
  const url = `${baseUrl}/${boardToken}/offices/`;
  const offices = await getOffices(url);
  return offices;
}

async function fetchDepartments(boardToken) {
  const url = `${baseUrl}/${boardToken}/departments/`;
  const departments = await getDepartments(url);
  return departments;
}

const getJobs = async url => {
  try {
    const response = await axios.get(url);
    const nodes = [];

    for (const job of response.data.jobs) {
      const node = await getJob(`${url}${job.id}?questions=true`);
      nodes.push(node);
    }

    return nodes;
  } catch (error) {
    console.log(error);
  }
};

const getJob = url =>
  axios
    .get(url)
    .then(response => response.data)
    .catch(error => console.log(error));

const getOffices = url =>
  axios
    .get(url)
    .then(response => response.data.offices)
    .catch(error => console.log(error));

const getDepartments = url =>
  axios
    .get(url)
    .then(response => response.data.departments)
    .catch(error => console.log(error));

module.exports = {
  fetchJobs,
  fetchOffices,
  fetchDepartments,
};
