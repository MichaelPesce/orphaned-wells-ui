import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Box } from "@mui/material";
import Subheader from "../../components/Subheader/Subheader";
import RecordGroupsTable from "../../components/RecordGroupsTable/RecordGroupsTable";
import NewRecordGroupDialog from "../../components/NewRecordGroupDialog/NewRecordGroupDialog";
import JsonImportDialog from "../../components/JsonImportDialog/JsonImportDialog";
import PopupModal from "../../components/PopupModal/PopupModal";
import ProjectTabs from "../../components/ProjectTabs/ProjectTabs";
import RecordsTable from "../../components/RecordsTable/RecordsTable";
import ErrorBar from "../../components/ErrorBar/ErrorBar";
import { useUserContext } from "../../usercontext";
import { getRecordGroups, updateProject, deleteProject } from "../../services/app.service";
import { callAPI, DEFAULT_FILTER_OPTIONS } from "../../util";
import { JsonImportResponse, ProjectData, SubheaderActions } from "../../types";

const Project = () => {
  let params = useParams();
  const navigate = useNavigate();
  const { hasPermission} = useUserContext();
  const [projectData, setProjectData] = useState({} as ProjectData);
  const [projectName, setProjectName] = useState("");
  const [record_groups, setRecordGroups] = useState<any[]>([]);
  const [unableToConnect, setUnableToConnect] = useState(false);
  const [showNewRecordGroupDialog, setShowNewRecordGroupDialog] = useState(false);
  const [showJsonImportDialog, setShowJsonImportDialog] = useState(false);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [openUpdateNameModal, setOpenUpdateNameModal] = useState(false);
  const [currentTab, setCurrentTab] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>("");
  const [filters, setFilters] = useState({...DEFAULT_FILTER_OPTIONS});
  const [loading, setLoading] = useState(true);
  const tabs = ["Record Groups", "All Records"];

  useEffect(() => {
    if (tabs[currentTab] === "Record Groups") {
      setLoading(true);
      callAPI(getRecordGroups, [params.id], handleFetchedRecordGroups, handleError);
    }
  }, [currentTab]);

  useEffect(() => {
    let filterOptions = [];
    let selectedFilterOptions = [];
    for (let rg of record_groups) {
      filterOptions.push({
        name: rg.name,
        checked: true,
        value: rg._id,
      });
      selectedFilterOptions.push(rg.name);
    }
    let tempFilters = {...filters};
    tempFilters["record_group_id"] = {
      key: "record_group_id",
      displayName: "Record Group",   
      type: "checkbox",
      operator: "equals",
      options: filterOptions,
      selectedOptions: selectedFilterOptions
    };
    setFilters(tempFilters);
  },[record_groups]);

  const handleFetchedRecordGroups = (data: any) => {
    setRecordGroups(data.record_groups);
    setProjectData(data.project);
    setProjectName(data.project.name);
    setLoading(false);
  };

  const handleError = (e: Error) => {
    console.error(e);
    setLoading(false);
    setUnableToConnect(true);
  };

  const styles = {
    outerBox: {
      backgroundColor: "#F5F5F6",
      height: "100vh"
    },
    innerBox: {
      paddingY: 5,
      paddingX: 5,
    },
  };

  const handleClickNewRecordGroup = () => {
    setShowNewRecordGroupDialog(true);
  };

  const handleSuccessfulJsonImport = (response: JsonImportResponse) => {
    setShowJsonImportDialog(false);
    navigate("/record_group/" + response.record_group_id);
  };

  const handleDeleteProject = () => {
    setOpenDeleteModal(false);
    callAPI(
      deleteProject,
      [projectData._id],
      (data: any) => navigate("/projects", { replace: true }),
      handleAPIErrorResponse
    );
  };

  const handleChangeProjectName = (event: React.ChangeEvent<HTMLInputElement>) => {
    setProjectName(event.target.value);
  };

  const handleUpdateProjectName = () => {
    setOpenUpdateNameModal(false);
    callAPI(
      updateProject,
      [params.id, { name: projectName }],
      (data: any) => window.location.reload(),
      handleAPIErrorResponse
    );
  };

  const handleUpdateProject = (update: any) => {
    setOpenUpdateNameModal(false);
    callAPI(
      updateProject,
      [params.id, update],
      (data: ProjectData) => setProjectData(data),
      handleAPIErrorResponse
    );
  };

  const handleAPIErrorResponse = (e: string) => {
    setErrorMsg(e);
  };

  const sortRecordGroups = (sortBy: string, sortAscending: number) => {
    try {
      let tempRecordGroups = [...record_groups];
      let sortFunction: (a: any, b: any) => number;
      if (sortBy === "progress") {
        sortFunction = (a,b) => {
          let a_unreviewed_amt = a.total_amt - a.reviewed_amt;
          let b_unreviewed_amt = b.total_amt - b.reviewed_amt;
          if (sortAscending === 1) return b_unreviewed_amt - a_unreviewed_amt; 
          else return a_unreviewed_amt - b_unreviewed_amt;
        };
      }
      else if (sortBy === "dateCreated") {
        sortFunction = (a,b) => {
          if (sortAscending === 1) return b[sortBy] - a[sortBy]; 
          else return a[sortBy] - b[sortBy]; 
        };
      }
      else if (["name", "description", "documentType"].includes(sortBy)) {
        sortFunction = (a,b) => {
          if ( a[sortBy] <= b[sortBy] ){
            return sortAscending;
          }
          if ( a[sortBy] > b[sortBy] ){
            return -1 * sortAscending;
          }
          return 0;
        };
      }
      else return;
      tempRecordGroups.sort(sortFunction);
      setRecordGroups(tempRecordGroups);
    } catch (e) {
      console.error("unable to sort:");
      console.error(e);
    }
        
        
  };

  const projectActions = {} as SubheaderActions;
  if (hasPermission("create_record_group") && hasPermission("upload_document")) {
    projectActions["Import JSON/CSV record group"] = () => setShowJsonImportDialog(true);
  }
  if (hasPermission("manage_project")) {
    projectActions["Change project name"] = () => setOpenUpdateNameModal(true);
    projectActions["Delete project"] = () => setOpenDeleteModal(true);
  }

  return (
    <Box sx={styles.outerBox}>
      <Subheader
        currentPage={projectData.name}
        buttonName={(hasPermission("create_record_group")) ? "New Record Group" : undefined}
        handleClickButton={handleClickNewRecordGroup}
        previousPages={
          { 
            "Projects": () => navigate("/projects", { replace: true }),
          }
        }
        actions={Object.keys(projectActions).length ? projectActions : null}
      />
      <Box sx={styles.innerBox}>
        {!unableToConnect ? 
          <div>
            <ProjectTabs options={tabs} value={currentTab} setValue={setCurrentTab}/>
            {
              tabs[currentTab] === "Record Groups" ? (
                <RecordGroupsTable
                  record_groups={record_groups}
                  sortRecordGroups={sortRecordGroups}
                  projectId={params.id || ""}
                  handleUpdate={handleUpdateProject}
                  loading={loading}
                />
              )
                                
                :
                tabs[currentTab] === "All Records" &&
                                <RecordsTable
                                  location="project"
                                  params={params}
                                  filter_options={filters}
                                  handleUpdate={handleUpdateProject}
                                  recordGroups={record_groups}
                                />
            }
                        
          </div>
          :
          null
        }
        <NewRecordGroupDialog 
          open={showNewRecordGroupDialog} 
          onClose={() => setShowNewRecordGroupDialog(false)} 
          project_id={params.id || ""}
        />
        <JsonImportDialog
          open={showJsonImportDialog}
          mode="create_record_group"
          projectId={params.id || ""}
          onClose={() => setShowJsonImportDialog(false)}
          onImported={handleSuccessfulJsonImport}
          setErrorMsg={setErrorMsg}
        />
      </Box>
      <PopupModal
        open={openDeleteModal}
        handleClose={() => setOpenDeleteModal(false)}
        text="Are you sure you want to delete this record group?"
        handleSave={handleDeleteProject}
        buttonText='Delete'
        buttonColor='error'
        buttonVariant='contained'
        width={400}
      />
      <PopupModal
        input
        open={openUpdateNameModal}
        handleClose={() => setOpenUpdateNameModal(false)}
        text={projectName}
        textLabel='Document group Name'
        handleEditText={handleChangeProjectName}
        handleSave={handleUpdateProjectName}
        buttonText='Update'
        buttonColor='primary'
        buttonVariant='contained'
        width={400}
      />
      <ErrorBar
        errorMessage={errorMsg}
        setErrorMessage={setErrorMsg}
      />
    </Box>
  );
};

export default Project;
