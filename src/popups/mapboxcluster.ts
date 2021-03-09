import axios from "axios";

export function mapboxpopup(res: any): string {
  return `<div> ${res.map((feature: any): any => {
    (async (): Promise<any> => {
      const job = await axios.get(
        "https://apps-test.integralgis.com/node/framework/api/getJob",
        {
          params: {
            jobProfileId: feature.properties?.JOB_ID.replace(/[{}]/g, ""),
          },
        }
      );

      const {
        data,
      } = await axios.get(
        "https://apps-test.integralgis.com/node/framework/api/getJobProfile",
        { params: { jobProfileId: job.data[0].JOB_PROFILE_ID } }
      );

      const { jobInformation } = data;

      return `<div style='color: white; background-color: #283246;'>${jobInformation.address}<div>`;
    })();
  })}</div>`;
}
