import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Grid, Box, IconButton, Alert, Tooltip } from "@mui/material";
import FullscreenIcon from "@mui/icons-material/Fullscreen";
import Rotate90DegreesCcwIcon from '@mui/icons-material/Rotate90DegreesCcw';
import FullscreenExitIcon from "@mui/icons-material/FullscreenExit";
import HistoryIcon from '@mui/icons-material/History';
import KeyboardIcon from "@mui/icons-material/Keyboard";
import { ImageCropper } from "../ImageCropper/ImageCropper";
import { useKeyDown, scrollIntoView, scrollToAttribute, coordinatesDecimalsToPercentage, callAPI, deriveAttribute, getAttributeRowId } from "../../util";
import AttributesTable from "../RecordAttributesTable/RecordAttributesTable";
import { DocumentContainerProps, updateFieldCoordinatesSignature, FieldID, RecordHistoryItem, Attribute } from "../../types";
import { DocumentContainerStyles as styles } from "../../styles";
import Switch from "@mui/material/Switch";
import TableLoading from "../TableLoading/TableLoading";
import HotkeyInfo from "../HotkeyInfo/HotkeyInfo";
import { getRecordHistory, rotateRecordImages } from "../../services/app.service";
import RecordHistoryDialog from "../RecordHistoryDialog/RecordHistoryDialog";
import ImageRotationDialog from "components/ImageRotationDialog/ImageRotationDialog";
import CircularProgress from '@mui/material/CircularProgress';

const HIDE_BLANK_PAGES = true;
const ROOT_PARENT_INDEXES: number[] = [];

interface FieldTraversalEntry {
  attribute: Attribute;
  indexes: number[];
}

const attributeIndexesMatch = (left: number[], right: number[]) => {
  return left.length === right.length && left.every((value, index) => value === right[index]);
};

const getFieldTraversalList = (attributes: Attribute[], parentIndexes: number[] = []): FieldTraversalEntry[] => {
  return attributes.flatMap((attribute, idx) => {
    const indexes = [...parentIndexes, idx];
    return [
      { attribute, indexes },
      ...getFieldTraversalList(attribute.subattributes || [], indexes),
    ];
  });
};

const DocumentContainer = ({
  imageFiles,
  attributesList,
  updateFieldCoordinates,
  loading,
  recordStatus,
  errorMessage,
  image_whitespace,
  record_group_id,
  setImageFiles,
  attributesTableUpdating = false,
  ...attributeTableProps
}: DocumentContainerProps) => {

  const [imgIndex, setImgIndex] = useState(0);
  const [displayPoints, setDisplayPoints] = useState<number[][] | null>(null);
  const [displayIndexes, setDisplayIndexes] = useState<number[]>([]);
  const [displayAttribute, setDisplayAttribute] = useState<Attribute>();
  const [fullscreen, setFullscreen] = useState<string | null>(null);
  const [gridWidths, setGridWidths] = useState<number[]>([5.9, 0.2, 5.9]);
  const [width, setWidth] = useState("100%");
  const [height, setHeight] = useState("auto");
  const [forceOpenSubtable, setForceOpenSubtable] = useState<number[] | null>(null);
  const [imageHeight, setImageHeight] = useState(0);
  const [ showRawValues, setShowRawValues ] = useState(false);
  const [ hasErrors, setHasErrors ] = useState(false);
  const [ zoomOnToken, setZoomOnToken ] = useState(JSON.parse(localStorage.getItem("zoomOnToken") || "false"));
  const [updateFieldLocationID, setUpdateFieldLocationID] = useState<FieldID>();
  const [hotkeysAnchor, setHotkeysAnchor] = useState<HTMLElement>();
  const [openHistoryDialog, setOpenHistoryDialog] = useState(false);
  const [recordHistory, setRecordHistory] = useState<RecordHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [openRotationDialog, setOpenRotationDialog] = useState(false);
  const [rotationLoading, setRotationLoading] = useState(false);
  const attributesListRef = React.useRef<Attribute[]>([]);
  const displayIndexesRef = React.useRef<number[]>([]);

  const imageDivStyle = {
    width: width,
    height: height,
    borderBottom: "1px solid #9a9c9a"
  };
  const params = useParams(); 
  const checkForErrors = () => {
    try {
      if (attributesList) {
        for (let attr of attributesList) {
          if (attr.cleaning_error) {
            setHasErrors(true);
            return;
          }
          if (attr.subattributes) {
            for (let subattr of attr.subattributes) {
              if (subattr.cleaning_error) {
                setHasErrors(true);
                return;
              }
            }
          }
        }
        setHasErrors(false);
        return;
      } else {
        setHasErrors(false);
        return;
      }
            
    } catch (e) {
      console.error(e);
      setHasErrors(false);
      return;
    }
        
  };

  useEffect(() => {
    checkForErrors();
  },[attributesList]);

  useEffect(() => {
    attributesListRef.current = attributesList || [];
  }, [attributesList]);

  useEffect(() => {
    displayIndexesRef.current = displayIndexes;
  }, [displayIndexes]);

  useEffect(() => {
    let newImgIdx = displayAttribute?.page || 0;
    setImgIndex(newImgIdx);
        
  }, [displayAttribute]);

  useEffect(() => {
    if (imageFiles && imageFiles.length > 0) {
      const img = new Image();

      img.onload = function() {
        const height = img.height;
        setImageHeight(height);
      };

      img.src = imageFiles[0];
    }
  }, [imageFiles]);

  useEffect(() => {
    setHotkeysAnchor(undefined);
    setDisplayPoints(null);
    setDisplayIndexes([]);
  }, [params.id]);

  const getVisualPageNumber = React.useCallback((pageNumber: number) => {
    if (!HIDE_BLANK_PAGES || !image_whitespace) return pageNumber;
    let visualPageNumber = 0;
    image_whitespace?.forEach((img, idx) => {
      if (idx < pageNumber && !img.is_mostly_whitespace) 
        visualPageNumber +=1;
    });
    // console.log(`${pageNumber} -> ${visualPageNumber}`)
    return visualPageNumber;
  }, [image_whitespace]);

  const getNextField = (direction: string = "down", currentIndexes: number[] = displayIndexes): [FieldID, number[][] | null] => {
    const traversalList = getFieldTraversalList(attributesList || []);
    const emptyFieldID: FieldID = {
      key: "",
      primaryIndex: -1,
      isSubattribute: false,
      subIndex: null,
      indexes: [],
    };

    if (traversalList.length === 0) return [emptyFieldID, null];

    const currentPosition = traversalList.findIndex(({ indexes }) => attributeIndexesMatch(indexes, currentIndexes));
    let nextPosition: number;
    if (currentPosition === -1) {
      nextPosition = direction === "up" ? traversalList.length - 1 : 0;
    } else if (direction === "up") {
      nextPosition = currentPosition === 0 ? traversalList.length - 1 : currentPosition - 1;
    } else {
      nextPosition = currentPosition === traversalList.length - 1 ? 0 : currentPosition + 1;
    }

    const nextField = traversalList[nextPosition];
    const nextCoordinates =
      nextField.attribute.user_provided_coordinates ||
      nextField.attribute.normalized_vertices ||
      null;
    const tempFieldID: FieldID = {
      key: nextField.attribute.key,
      primaryIndex: nextField.indexes[0],
      isSubattribute: nextField.indexes.length > 1,
      subIndex: nextField.indexes.length > 1 ? nextField.indexes[nextField.indexes.length - 1] : null,
      parentKey: attributesList[nextField.indexes[0]]?.key,
      indexes: nextField.indexes,
    };
    return [tempFieldID, nextCoordinates];
  };

  const proceedToNextField = (nextField: FieldID) => {
    const { isSubattribute, indexes } = nextField;
    if (!indexes.length) return;

    if (isSubattribute) {
      setForceOpenSubtable(indexes.slice(0, -1));
    }
    const elementId = getAttributeRowId(indexes);
    let element = document.getElementById(elementId);
    let waitTime = 0;
    let containerElement = document.getElementById("table-container");
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
    } else {
      waitTime = 250;
      setTimeout(function() {
        element = document.getElementById(elementId);
        if (element) element.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
      }, waitTime);
    }
  };

  const tabCallback = () => {
    const [nextField, vertices] = getNextField("down");
    handleClickField(nextField, vertices);
    proceedToNextField(nextField);
  };

  const shiftTabCallback = () => {
    const [nextField, vertices] = getNextField("up");
    handleClickField(nextField, vertices);
    proceedToNextField(nextField);
  };

  useKeyDown("Tab", tabCallback, shiftTabCallback);
  useKeyDown("ArrowUp", shiftTabCallback);
  useKeyDown("ArrowDown", tabCallback);

  const handleClickField = React.useCallback((fieldID: FieldID, coordinates: number[][] | null, forceDisplay: boolean = false, pageNumber?: number) => {
    const { key, indexes } = fieldID;
    const currentDisplayIndexes = displayIndexesRef.current;
    const fieldIsAlreadySelected = indexes.length === currentDisplayIndexes.length && indexes.every((val, index) => val === currentDisplayIndexes[index]);
    if (!forceDisplay && (!key || fieldIsAlreadySelected)) {
      setDisplayPoints(null);
      setDisplayIndexes([]);
    }
    else {
      setDisplayIndexes([...indexes]);
      let current_attr = deriveAttribute(indexes, attributesListRef.current);
      setDisplayAttribute(current_attr);
      if (coordinates !== null && coordinates !== undefined) {
        const percentage_vertices: number[][] = [];
        for (let each of coordinates) {
          percentage_vertices.push([each[0] * 100, each[1] * 100]);
        }
        let page = 0;
        try {
          if (current_attr?.page !== undefined) page = current_attr?.page;
        } catch (e) {
          console.log("error getting page");
          console.log(e);
        }
        if (pageNumber) page = pageNumber;
        page = getVisualPageNumber(page);
        const scrollTop = (coordinates[2][1] / imageFiles.length) + (page / imageFiles.length);
        setDisplayPoints(percentage_vertices);
        scrollToAttribute("image-box", "image-div", scrollTop, imageFiles);
      } else {
        setDisplayPoints(null);
      }
    }
  }, [imageFiles, getVisualPageNumber]);
    

  const handleSetFullscreen = (item: string) => {
    if (fullscreen === item)  {
      setGridWidths([5.9, 0.2, 5.9]);
      setFullscreen(null);
    }
    else { 
      setFullscreen(item);
      if (item === "image") setGridWidths([12, 0, 0]);
      else if (item === "table") setGridWidths([0, 0, 12]);
    }
  };

  const handleToggleZoom = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    setZoomOnToken(!zoomOnToken);
    localStorage.setItem("zoomOnToken", JSON.stringify(!zoomOnToken));
  };

  const handleUpdateFieldCoordinates: updateFieldCoordinatesSignature = (fieldId, new_coordinates, pageNumber) => {
    const callbackFunc = () => {
      handleClickField(fieldId, new_coordinates, true, pageNumber);
    };
    updateFieldCoordinates(fieldId, new_coordinates, pageNumber, callbackFunc);
  };

  const handleToggleHotkeys = (event: React.MouseEvent<HTMLButtonElement>) => {
    setHotkeysAnchor(event.currentTarget);
  };

  const handleGetRecordHistory = () => {
    if (!params.id) {
      console.error("missing record id");
      return;
    }
    setOpenHistoryDialog(true);
    setHistoryLoading(true);
    callAPI(
      getRecordHistory,
      [params.id],
      (history: RecordHistoryItem[]) => {
        setRecordHistory(history);
        setHistoryLoading(false);
      },
      (error, status) => {
        console.error("error fetching record history:", status, error);
        setHistoryLoading(false);
      }
    );
  };

  const handleRotateImages = (selectedIndices: number[], degrees: number) => {
    if (!params.id || !record_group_id) {
      console.error("Missing record ID or record group ID");
      return;
    }

    setRotationLoading(true);
    callAPI(
      rotateRecordImages,
      [params.id, selectedIndices, degrees, record_group_id],
      (response: any) => {
        // console.log("Images rotated successfully:", response);
        setRotationLoading(false);
        setOpenRotationDialog(false);
        setImageFiles(response.new_image_urls);
      },
      (error, status) => {
        console.error("Error rotating images:", status, error);
        setRotationLoading(false);
        // Optionally show an error message to the user
      }
    );
  };



  const showErrorState = !loading && !attributesList && recordStatus === "error";
  const resolvedErrorMessage = errorMessage || "Unknown error.";

  return (
    <Box style={styles.outerBox}>
      {
        hasErrors &&
                <Alert severity='error' sx={styles.errorAlert} variant='outlined'>
                  <b>Errors present: Record was cleaned with errors for some fields</b>
                </Alert>
      }
            
      <Grid container>
        {
          fullscreen !== "image" && 
                    <Grid item xs={gridWidths[2]}>
                      <Box sx={styles.gridContainer}>
                        <Box sx={styles.containerActions.both}>
                          <p>
                          </p>
                          <p>
                                    Raw Values 
                            <Switch checked={showRawValues} onChange={() => setShowRawValues(!showRawValues)} size='small'/>
                            <IconButton id='record-history-table-button' onClick={handleGetRecordHistory}>
                              <HistoryIcon/>
                            </IconButton>
                            <IconButton id='fullscreen-table-button' onClick={() => handleSetFullscreen("table")}>
                              { 
                                fullscreen === "table" ? <FullscreenExitIcon/> : <FullscreenIcon/> 
                              }
                            </IconButton>
                            <IconButton id='hotkey-info-button' onClick={handleToggleHotkeys}>
                              <KeyboardIcon/>
                            </IconButton>
                            <HotkeyInfo anchorEl={hotkeysAnchor} onClose={() => setHotkeysAnchor(undefined)}/>
                          </p>
                                
                        </Box>
                        {showErrorState ? (
                          <Box sx={styles.errorStateOuterBox}>
                            <Box sx={styles.errorState}>
                              <Box sx={styles.errorStateTitle}>Processing Error</Box>
                              <Box sx={styles.errorStateMessage}>{resolvedErrorMessage}</Box>
                            </Box>
                          </Box>
                        ) : attributesList !== undefined ? (
                          <Box sx={{ position: "relative" }}>
                            <Box
                              sx={{
                                opacity: attributesTableUpdating ? 0.45 : 1,
                                pointerEvents: attributesTableUpdating ? "none" : "auto",
                                transition: "opacity 180ms ease",
                              }}
                            >
                              <AttributesTable 
                                attributesList={attributesList}
                                handleClickField={handleClickField}
                                fullscreen={fullscreen}
                                forceOpenSubtable={forceOpenSubtable}
                                displayIndexes={displayIndexes}
                                showRawValues={showRawValues}
                                setUpdateFieldLocationID={setUpdateFieldLocationID}
                                parentIndexes={ROOT_PARENT_INDEXES}
                                {...attributeTableProps}
                              />
                            </Box>
                            {attributesTableUpdating && (
                              <Box
                                sx={{
                                  position: "absolute",
                                  inset: 0,
                                  zIndex: 2,
                                  display: "flex",
                                  justifyContent: "center",
                                  alignItems: "flex-start",
                                  paddingTop: "64px",
                                  backgroundColor: "rgba(255, 255, 255, 0.12)",
                                  pointerEvents: "auto",
                                }}
                              >
                                <CircularProgress size={24} thickness={4}/>
                              </Box>
                            )}
                          </Box>
                        ) : (
                          loading && <TableLoading/>
                        )}
                      </Box>
                    </Grid>
        }
        <Grid item xs={gridWidths[1]}></Grid>
        {fullscreen !== "table" && 
                    <Grid item xs={gridWidths[0]}>
                      <Box sx={styles.gridContainer}>
                        <Box sx={styles.containerActions.right}>
                          <Tooltip title="Rotate Image(s)" placement="left">
                            <IconButton id="rotate-image-button" onClick={() => setOpenRotationDialog(true)}>
                              <Rotate90DegreesCcwIcon/>
                            </IconButton>
                          </Tooltip>
                          <IconButton id='fullscreen-image-button' onClick={() => handleSetFullscreen("image")}>
                            { 
                              fullscreen === "image" ? <FullscreenExitIcon/> : <FullscreenIcon/> 
                            }
                          </IconButton>
                        </Box>
                        <Box
                          id="image-box"
                          sx={{
                            ...styles.imageBox,
                            position: "relative",
                          }}
                        >
                          <Box
                            sx={{
                              opacity: rotationLoading ? 0.45 : 1,
                              transition: "opacity 180ms ease",
                            }}
                          >
                            {imageFiles &&
                              imageFiles.map((imageFile, idx) => {
                                let display_image = true;
                                if (
                                  HIDE_BLANK_PAGES &&
                                  image_whitespace?.[idx] &&
                                  image_whitespace?.[idx].is_mostly_whitespace
                                ) {
                                  display_image = false;
                                }

                                if (display_image)
                                  return (
                                    <div key={imageFile} style={imageDivStyle} id="image-div">
                                      <ImageCropper
                                        image={imageFile}
                                        imageIdx={idx}
                                        highlightedImageIdxIndex={imgIndex}
                                        displayPoints={displayPoints}
                                        disabled
                                        fullscreen={fullscreen}
                                        zoomOnToken={false}
                                        updateFieldLocationID={updateFieldLocationID}
                                        setUpdateFieldLocationID={setUpdateFieldLocationID}
                                        handleUpdateFieldCoordinates={handleUpdateFieldCoordinates}
                                      />
                                    </div>
                                  );

                                return null;
                              })}
                          </Box>

                          {rotationLoading && (
                            <Box
                              sx={{
                                position: "absolute",
                                inset: 0,
                                zIndex: 9999,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                backgroundColor: "rgba(0, 0, 0, 0.18)",
                                backdropFilter: "blur(1px)",
                                pointerEvents: "none", // let the overlay not block anything if you prefer
                                transition: "opacity 180ms ease",
                              }}
                            >
                              <CircularProgress />
                            </Box>
                          )}
                        </Box>
                      </Box>
                    </Grid>
        }
                
      </Grid>
      <RecordHistoryDialog
        open={openHistoryDialog}
        onClose={() => setOpenHistoryDialog(false)}
        history={recordHistory}
        loading={historyLoading}
      />
      <ImageRotationDialog
        open={openRotationDialog}
        imageFiles={imageFiles || []}
        onClose={() => setOpenRotationDialog(false)}
        onSubmit={handleRotateImages}
      />
    </Box>
  );
};

export default DocumentContainer;
