import ProjectExportUrl from '@site/static/screenshots/project-export.png';
import ExportFieldSelectionUrl from '@site/static/screenshots/export-field-selection.png';
import ExportSelectedRecordGroupsUrl from '@site/static/screenshots/export-selected-record-groups.png';
import ProjectListUrl from '@site/static/screenshots/project-list.png';
import ProjectReportsUrl from '@site/static/screenshots/project-reports.png';
import ProjectReviewUrl from '@site/static/screenshots/project-review.png';
import ProjectViewUrl from '@site/static/screenshots/project-view.png';
import AddNewUserUrl from '@site/static/screenshots/add-new-user.png';
import UsersPageUrl from '@site/static/screenshots/users-page.png';
import UpdateUserRoleButtonUrl from '@site/static/screenshots/update-user-button.png';
import AssignUserRolesUrl from '@site/static/screenshots/assign-user-roles.png';
import UploadRecordsModalUrl from '@site/static/screenshots/upload-records-modal.png';
import UploadDocumentUrl from '@site/static/screenshots/upload-document.png';
import UploadDirectoryUrl from '@site/static/screenshots/upload-directory.png';
import GcsUploadUrl from '@site/static/screenshots/GCS-upload.png';
import SchemaViewUrl from '@site/static/screenshots/schema-view.png';
import UploadProcessorUrl from '@site/static/screenshots/upload-processor.png';
import EditProcessorUrl from '@site/static/screenshots/edit-processor.png';

const imageStyle = {
    boxShadow: '0 0 10px rgba(0, 0, 0, 0.4)',
    borderRadius: 10,
    padding: 20,
    marginTop: 10
};

export function ProjectExportImg() {
    return <img src={ProjectExportUrl} alt="Export project dialog with JSON selected, User Notes, field selection, and the Export Data button" style={imageStyle}/>;
}
export function ExportFieldSelectionImg() {
    return <img src={ExportFieldSelectionUrl} alt="Export dialog filtering field names by receipt and showing nested table fields" style={imageStyle}/>;
}
export function ExportSelectedRecordGroupsImg() {
    return <img src={ExportSelectedRecordGroupsUrl} alt="Export dialog for two selected record groups with all four formats selected and fields grouped by document type" style={imageStyle}/>;
}
export function ProjectListImg() {
    return <img src={ProjectListUrl} style={imageStyle}/>;
}
export function ProjectReportsImg() {
    return <img src={ProjectReportsUrl} style={imageStyle}/>;
}
export function ProjectReviewImg() {
    return <img src={ProjectReviewUrl} style={imageStyle}/>;
}
export function ProjectViewImg() {
    return <img src={ProjectViewUrl} style={imageStyle}/>;
}
export function AddNewUser() {
    return <img src={AddNewUserUrl} alt="Add user dialog with an email address ready to submit" style={imageStyle}/>;
}
export function UsersPage() {
    return <img src={UsersPageUrl} alt="Admin Users page with team and system roles and the Add user button" style={imageStyle}/>;
}
export function UpdateUserRoleButton() {
    return <img src={UpdateUserRoleButtonUrl} alt="Update roles action in the Users table" style={imageStyle}/>;
}
export function AssignUserRoles() {
    return <img src={AssignUserRolesUrl} alt="Assign roles dialog showing selectable system and team role chips" style={imageStyle}/>;
}
export function UploadRecordsModalImg() {
    return <img src={UploadRecordsModalUrl} style={imageStyle}/>;
}
export function UploadDocumentImg() {
    return <img src={UploadDocumentUrl} alt="Upload records dialog with the File / ZIP tab and a deployed processor" style={imageStyle}/>;
}
export function UploadDirectoryImg() {
    return <img src={UploadDirectoryUrl} alt="Local directory upload with selected files, upload amount, and duplicate and cleaning options" style={imageStyle}/>;
}
export function GcsUploadImg() {
    return <img src={GcsUploadUrl} alt="GCS directory upload with bucket and prefix fields, Check path, and Start processing" style={imageStyle}/>;
}
export function SchemaViewImg() {
    return <img src={SchemaViewUrl} style={imageStyle}/>;
}
export function UploadProcessorImg() {
    return <img src={UploadProcessorUrl} style={imageStyle}/>;
}
export function EditProcessorImg() {
    return <img src={EditProcessorUrl} style={imageStyle}/>;
}
