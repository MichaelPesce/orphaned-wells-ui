import ProjectExportUrl from '@site/static/screenshots/project-export.png';
import ProjectListUrl from '@site/static/screenshots/project-list.png';
import ProjectReportsUrl from '@site/static/screenshots/project-reports.png';
import ProjectReviewUrl from '@site/static/screenshots/project-review.png';
import ProjectViewUrl from '@site/static/screenshots/project-view.png';
import AddNewUserUrl from '@site/static/screenshots/add-new-user.png';
import UsersPageUrl from '@site/static/screenshots/users-page.png';
import UpdateUserRoleButtonUrl from '@site/static/screenshots/update-user-button.png';
import UploadRecordsModalUrl from '@site/static/screenshots/upload-records-modal.png';
import UploadDirectoryUrl from '@site/static/screenshots/upload-directory.png';
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
    return <img src={ProjectExportUrl} style={imageStyle}/>;
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
    return <img src={AddNewUserUrl} style={imageStyle}/>;
}
export function UsersPage() {
    return <img src={UsersPageUrl} style={imageStyle}/>;
}
export function UpdateUserRoleButton() {
    return <img src={UpdateUserRoleButtonUrl} style={imageStyle}/>;
}
export function UploadRecordsModalImg() {
    return <img src={UploadRecordsModalUrl} style={imageStyle}/>;
}
export function UploadDirectoryImg() {
    return <img src={UploadDirectoryUrl} style={imageStyle}/>;
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
