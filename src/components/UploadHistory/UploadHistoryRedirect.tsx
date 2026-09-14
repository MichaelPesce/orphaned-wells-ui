import { Navigate, useParams, useSearchParams } from "react-router-dom";

// Keep bookmarked record-group history and job links working after the move to Admin.
const UploadHistoryRedirect = () => {
  const {id = ""} = useParams<{id: string}>();
  const [search] = useSearchParams();
  const next = new URLSearchParams({tab: "uploads", record_group: id});
  const job = search.get("job");
  if (job) {next.set("job", job); next.set("job_group", id);}
  return <Navigate replace to={`/admin?${next}`} />;
};

export default UploadHistoryRedirect;
