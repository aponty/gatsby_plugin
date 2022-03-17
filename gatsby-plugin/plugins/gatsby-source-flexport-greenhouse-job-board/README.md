Local plugin, fork of  gatsby-source-greenhouse-job-board

I beleve that plugin is still required as a dependency; 

"gatsby-source-greenhouse-job-board": "^1.0.3",

loaded in gatsby-config 

    {
      resolve: "gatsby-source-flexport-greenhouse-job-board",
      options: {
        boardToken: "flexport",
        activeEnv,
      },
    },


and then data is accessed in gatsby-node; queried with 

 allGreenhouseJob {
          edges {
            node {
              id
              title
              gh_Id
              location {
                name
              }
              departments {
                name
              }
            }
          }
        }

and it is here that the errors occur.


Greenhouse API is unreliable. If you hit it enough, you'll get rate limited (ERROR CONN REFUSED) or simply get incorrect data that leads to errors in the gatsby-node steps. 

Our error checking there is 

const locationName = job?.location?.name;
const firstDepartmentName = job?.departments[0]?.name;

if (!locationName || !firstDepartmentName) {
  throw new Error("greenhouseError");
}


But the real issue is that the plugin data is ending up in the cache somehow. 