const fs = require("fs");
const chalk = require("chalk");

const {fetchJobs, fetchOffices, fetchDepartments} = require("./fetch");
const {
  filterResponseForIds,
  buildNodesFromResponse,
  linkParentChildReferences,
  linkForeignReferences,
} = require(`./normalize`);
const CACHE_DIR = "plugins/gatsby-source-flexport-greenhouse-job-board/cache";

const log = message => console.log("\n", message);

const fetchData = async boardToken => {
  try {
    const offices = await fetchOffices(boardToken);
    const departments = await fetchDepartments(boardToken);
    const jobs = await fetchJobs(boardToken);
    return {offices, departments, jobs};
  } catch (error) {
    log(`${chalk.red.bold("error")} Greenhouse fetch failed ${error}`);
    process.exit(1);
  }
};

const readCache = () => {
  const offices = JSON.parse(fs.readFileSync(`${CACHE_DIR}/offices.json`));
  const departments = JSON.parse(
    fs.readFileSync(`${CACHE_DIR}/departments.json`)
  );
  const jobs = JSON.parse(fs.readFileSync(`${CACHE_DIR}/jobs.json`));
  return {offices, departments, jobs};
};

const writeCache = (offices, depts, jobs) => {
  fs.writeFileSync(`${CACHE_DIR}/offices.json`, JSON.stringify(offices));
  fs.writeFileSync(`${CACHE_DIR}/departments.json`, JSON.stringify(depts));
  fs.writeFileSync(`${CACHE_DIR}/jobs.json`, JSON.stringify(jobs));
};

exports.sourceNodes = async (gatsby, pluginOptions) => {
  try {
    const {actions} = gatsby;
    const {createNode} = actions;
    const {boardToken, activeEnv} = pluginOptions;
    let offices, departments, jobs;
    let nodes;

    if (activeEnv === "development") {
      try {
        log(`${chalk.blue("info")} Using cached greenhouse data`);
        ({offices, departments, jobs} = readCache());
      } catch (error) {
        log(`${chalk.blue("info")} Cache failed; clearing & refreshing...`);
        log(`${chalk.blue("info")} Refreshed cache should be committed`);
        ({offices, departments, jobs} = await fetchData(boardToken));
        writeCache(offices, departments, jobs);
      }
    } else {
      ({offices, departments, jobs} = await fetchData(boardToken));
    }

    log(`
    ${chalk.blue("info")} fetched from Greenhouse API:
    ${chalk.bold(jobs.length)} jobs,
    ${chalk.bold(offices.length)} offices,
    ${chalk.bold(departments.length)} departments
    `);

    // Greenhouse API will return "No Office" and "No Department" entities with an ID of 0. Let's remove these.
    // Construct the node objects from the API responses
    nodes = buildNodesFromResponse({
      offices: filterResponseForIds(offices),
      departments: filterResponseForIds(departments),
      jobs: filterResponseForIds(jobs),
    });

    // Link Offices to their parents/children
    // Link Departments to their parents/children
    nodes = linkParentChildReferences(nodes); // Link Offices to Departments and Jobs

    // Link Departments to Jobs
    // Link Jobs to Departments and Offices
    nodes = linkForeignReferences(nodes); // Create the nodes with Gatsby

    await Promise.all(nodes.map(async node => createNode(node)));
    return;
  } catch (error) {
    log(`${chalk.red.bold("error")} ${error}`);
    log(
      `${chalk.blue(
        "info"
      )} This error occurred fetching Greenhouse Jobs data. If the cache was used, consider deleting departments.json, jobs.json, & offices.json to refresh on next build`
    );
    process.exit(1);
  }
};
