import { useState, useEffect } from "react";
import {
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  IconButton,
} from "@mui/material";
import { deleteProcessorSchema } from "../../services/app.service";
import { schemaOverviewColumns as columns, callAPI } from "../../util";
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PopupModal from "../PopupModal/PopupModal";
import QuickLook from "../QuickLook/QuickLook";
import { MongoProcessor } from "../../types";

interface SchemaSheetProps {
  processors: MongoProcessor[];
  setTabValue: (v: number) => void;
  setEditingProcessor: (i: number) => void;
}

const styles = {
  iconButton: {
    padding: "4px",
    margin: 0
  }
}

const SchemaOverViewSheet = ({ processors, setTabValue, setEditingProcessor }: SchemaSheetProps) => {
  const [showDeleteProcessorModal, setShowDeleteProcessorModal] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<number>();
  const [previewImage, setPreviewImage] = useState<string>();

  if (!processors || processors.length === 0) {
    return (
      <Table>
        <TableBody>
          <TableRow>
            <TableCell>No data</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );
  }

  const handleClickDeleteIcon = (idx: number) => {
    setPendingDelete(idx);
    setShowDeleteProcessorModal(true);
  }

  const handleDeleteProcessor = () => {
    setShowDeleteProcessorModal(false);
    if (pendingDelete !== undefined) {
      const processor = processors[pendingDelete];
      const {
        name
      } = processor;
      callAPI(
        deleteProcessorSchema,
        [name],
        successfulDelete,
        failedlDelete
      )
    } else {
      console.error("processor idx is not found in list")
    }
  }

  const successfulDelete = (data: any) => {
    window.location.reload();
  }

  const failedlDelete = (data: any) => {
    console.log("failed to delete processor")
    console.log(data)
  }

  return (
    <Table stickyHeader sx={{ minWidth: 650 }}>
      <TableHead>
        <TableRow sx={{ backgroundColor: "#fbfbfb" }}>
          {columns.map((col) => (
            <TableCell
              key={col.key}
              sx={{ fontWeight: 600 }}
              align={col.key === "img" ? "center" : "left"}
            >
              {col.displayName}
            </TableCell>
          ))}
          <TableCell sx={{ fontWeight: 600 }} align="center">Actions</TableCell>
        </TableRow>
      </TableHead>

      <TableBody>
        {processors.map((row: any, idx: number) => (
          <TableRow
            onClick={() => {
                const newTabValue = idx+1;
                setTabValue(newTabValue)
            }}
            key={idx}
            hover
            sx={{
              cursor: "pointer",
              "&:hover": { backgroundColor: "rgba(0,0,0,0.03)" },
              "& td": {
                borderBottom: "1px solid #eee",
                padding: "12px 16px",
              },
            }}
          >
            {columns.map((col) => {
                let content;
                let val = row[col.key]
                if (col.key === "img") content = <img style={{height: "16px"}} src={val}></img>
                else content = val;
                return (
                    <TableCell
                        onClick={(e) => {
                          if (col.key === "img") {
                            e.stopPropagation();
                            if (val)
                              setPreviewImage(val);
                          }
                        }}
                        align={col.key === "img" ? "center" : "left"}
                        key={col.key}
                    >
                        {content}
                    </TableCell>
                )
                
            })}
            <TableCell onClick={(e) => e.stopPropagation()} align="center">
              <IconButton sx={styles.iconButton} onClick={() => setEditingProcessor(idx)}>
                <EditIcon/>
              </IconButton>
              <IconButton sx={styles.iconButton} onClick={() => handleClickDeleteIcon(idx)}>
                <DeleteIcon/>
              </IconButton>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
      <PopupModal
          open={showDeleteProcessorModal}
          handleClose={() => setShowDeleteProcessorModal(false)}
          text={`Are you sure you would like to remove ${processors[pendingDelete || 0].name}?`}
          handleSave={handleDeleteProcessor}
          buttonText='Remove'
          buttonColor='error'
          buttonVariant='contained'
          width={400}
      />
      {
        previewImage && 
        <QuickLook
          open={previewImage !== undefined}
          onClose={() => setPreviewImage(undefined)}
          imageUrl={previewImage}
        />
      }
    </Table>
  );
};

export default SchemaOverViewSheet;
