import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Grid, Box, IconButton, Alert, Tooltip } from "@mui/material";
import FullscreenIcon from "@mui/icons-material/Fullscreen";
import FullscreenExitIcon from "@mui/icons-material/FullscreenExit";
import KeyboardIcon from "@mui/icons-material/Keyboard";
import { ImageCropper } from "../ImageCropper/ImageCropper";
import { useKeyDown, scrollIntoView, scrollToAttribute, coordinatesDecimalsToPercentage } from "../../util";
import AttributesTable from "../RecordAttributesTable/RecordAttributesTable";
import { DocumentContainerProps, updateFieldCoordinatesSignature, FieldID } from "../../types";
import { DocumentContainerStyles as styles } from "../../styles";
import Switch from "@mui/material/Switch";
import TableLoading from "../TableLoading/TableLoading";
import HotkeyInfo from "../HotkeyInfo/HotkeyInfo";

const DocumentContainer = ({
  imageFiles,
  attributesList,
  updateFieldCoordinates,
  loading,
  recordStatus,
  errorMessage,
  ...attributeTableProps
}: DocumentContainerProps) => {

  const [imgIndex, setImgIndex] = useState(0);
  const [displayPoints, setDisplayPoints] = useState<number[][] | null>(null);
  const [displayKeyIndex, setDisplayKeyIndex] = useState(-1);
  const [displayKeySubattributeIndex, setDisplayKeySubattributeIndex] = useState<number | null>(null);
  const [fullscreen, setFullscreen] = useState<string | null>(null);
  const [gridWidths, setGridWidths] = useState<number[]>([5.9, 0.2, 5.9]);
  const [width, setWidth] = useState("100%");
  const [height, setHeight] = useState("auto");
  const [forceOpenSubtable, setForceOpenSubtable] = useState<number | null>(null);
  const [imageHeight, setImageHeight] = useState(0);
  const [ showRawValues, setShowRawValues ] = useState(false);
  const [ autoCleanFields, setAutoCleanFields ] = useState(true);
  const [ hasErrors, setHasErrors ] = useState(false);
  const [ zoomOnToken, setZoomOnToken ] = useState(JSON.parse(localStorage.getItem("zoomOnToken") || "false"));
  const [updateFieldLocationID, setUpdateFieldLocationID] = useState<FieldID>();
  const [hotkeysAnchor, setHotkeysAnchor] = useState<HTMLElement>();

  const imageDivStyle = {
    width: width,
    height: height,
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
    let newImgIdx;
    if (displayKeyIndex !== -1 && displayKeySubattributeIndex !== null) {
      newImgIdx = attributesList[displayKeyIndex].subattributes[displayKeySubattributeIndex].page;
    } 
    else if (displayKeyIndex !== -1) {
      newImgIdx = attributesList[displayKeyIndex].page;
    }
    else {
      newImgIdx = 0;
    }
    if (newImgIdx === null || newImgIdx === undefined) newImgIdx = 0;
    setImgIndex(newImgIdx);
        
  }, [displayKeyIndex, displayKeySubattributeIndex]);

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
    setDisplayKeyIndex(-1);
  }, [params.id]);

  const getNextField = (direction: string = "down", currentIndex: number = displayKeyIndex, currentSubindex: number | null = displayKeySubattributeIndex) => {
    let nextIndex: number;
    let nextSubindex: number | null;
    let isSubattribute: boolean;
    let nextKey: string;
    let nextCoordinates: any;
    let parentKey: string;

    if (direction === "down"){
      if (currentIndex === -1) {
        nextIndex = 0;
        nextSubindex = null;
      } 
      else if (attributesList[currentIndex].subattributes) {
        if (currentSubindex === null || currentSubindex === undefined) {
          nextSubindex = 0;
          nextIndex = currentIndex;
        } else if (currentSubindex === attributesList[currentIndex].subattributes.length - 1) {
          nextSubindex = null;
          nextIndex = currentIndex === attributesList.length - 1 ? 0 : currentIndex + 1;
        } else { 
          nextSubindex = currentSubindex + 1;
          nextIndex = currentIndex;
        }
      }
      else if (currentIndex === attributesList.length - 1)  {
        nextIndex = 0;
        nextSubindex = null;
      }
      else {
        nextIndex = currentIndex + 1;
        nextSubindex = null;
      }
    } else { // if (direction === "up") 
      if (currentIndex === -1) {
        nextIndex = attributesList.length - 1;
        nextSubindex = null;
      } 
      else if (attributesList[currentIndex].subattributes) {
        if (currentSubindex === null || currentSubindex === undefined) {
          nextSubindex = attributesList[currentIndex].subattributes.length - 1;
          nextIndex = currentIndex;
        } else if (currentSubindex === 0) {
          nextSubindex = null;
          nextIndex = currentIndex === 0 ? attributesList.length - 1 : currentIndex - 1;
        } else { 
          nextSubindex = currentSubindex - 1;
          nextIndex = currentIndex;
        }
      }
      else if (currentIndex === 0)  {
        nextIndex = attributesList.length - 1;
        nextSubindex = null;
      }
      else {
        nextIndex = currentIndex - 1;
        nextSubindex = null;
      }
    }


    if (nextSubindex !== null && nextSubindex !== undefined) {
      isSubattribute = true;
      nextKey = attributesList[nextIndex].subattributes[nextSubindex].key;
      nextCoordinates = 
                attributesList[nextIndex].subattributes[nextSubindex].user_provided_coordinates ||
                attributesList[nextIndex].subattributes[nextSubindex].normalized_vertices;
    } else {
      isSubattribute = false;
      nextKey = attributesList[nextIndex].key;
      nextCoordinates = 
                attributesList[nextIndex].user_provided_coordinates ||
                attributesList[nextIndex].normalized_vertices;
    }
    parentKey = attributesList[nextIndex].key;
    const tempFieldID: FieldID = {
      key: nextKey,
      primaryIndex: nextIndex,
      isSubattribute: isSubattribute,
      subIndex: nextSubindex,
      parentKey,
    };
    return [tempFieldID, nextCoordinates];
  };

  const proceedToNextField = (nextField: FieldID) => {
    const { key, isSubattribute, primaryIndex, subIndex } = nextField;
    let elementId: string;

    if (isSubattribute) {
      setForceOpenSubtable(primaryIndex);
      elementId = `${key}::${primaryIndex}::${subIndex}`;
    } 
    else elementId = `${key}::${primaryIndex}`;
    let element = document.getElementById(elementId);
    let waitTime = 0;
    let containerElement = document.getElementById("table-container");
    if (element) {
      if (isSubattribute) {
        setTimeout(function() {
          if (element)
            element.scrollIntoView({ behavior: "smooth", block: "end", inline: "nearest" });
        }, waitTime);
      }
      else 
        scrollIntoView(element, containerElement);
    } else {
      waitTime = 250;
      setTimeout(function() {
        element = document.getElementById(elementId);
        if (element) element.scrollIntoView({ behavior: "smooth", block: "end", inline: "nearest" });
      }, waitTime);
    }
  };

  const tabCallback = () => {
    const [nextField, vertices] = getNextField("down");
    handleClickField(nextField, vertices);
    let nextScrollToField = {...nextField};
    let i = 0; // add this as a safe catch incase we messed up this while logic
    while (nextScrollToField.isSubattribute && i<100) {
      [nextScrollToField] = getNextField("down", nextScrollToField.primaryIndex, nextScrollToField.subIndex);
      i+=1;
    } 
    proceedToNextField(nextScrollToField);
  };

  const shiftTabCallback = () => {
    const [nextField, vertices] = getNextField("up");
    handleClickField(nextField, vertices);
    let nextScrollToField = {...nextField};
    let i = 0; // add this as a safe catch incase we messed up this while logic
    while (nextScrollToField.isSubattribute && i<100) {
      [nextScrollToField] = getNextField("down", nextScrollToField.primaryIndex, nextScrollToField.subIndex);
      i+=1;
    }
    proceedToNextField(nextScrollToField);
  };

  useKeyDown("Tab", tabCallback, shiftTabCallback);
  useKeyDown("ArrowUp", shiftTabCallback);
  useKeyDown("ArrowDown", tabCallback);

  const handleClickField = React.useCallback((fieldID: FieldID, coordinates: number[][] | null) => {
    const { key, primaryIndex, subIndex = 0, isSubattribute } = fieldID;
    if (!key || (!isSubattribute && primaryIndex === displayKeyIndex) || (isSubattribute && primaryIndex === displayKeyIndex && subIndex === displayKeySubattributeIndex)) {
      setDisplayPoints(null);
      setDisplayKeyIndex(-1);
      setDisplayKeySubattributeIndex(null);
    }
    else {
      setDisplayKeyIndex(primaryIndex);
      setDisplayKeySubattributeIndex(subIndex);
      if (coordinates !== null && coordinates !== undefined) {
        const percentage_vertices: number[][] = [];
        for (let each of coordinates) {
          percentage_vertices.push([each[0] * 100, each[1] * 100]);
        }
        let page = 0;
        try {
          let attr = attributesList[primaryIndex];
          if (isSubattribute) attr = attr.subattributes[subIndex as number];
          if (attr.page !== undefined) page = attr.page;
        } catch (e) {
          console.log("error getting page");
          console.log(e);
        }
        const scrollTop = (coordinates[2][1] / imageFiles.length) + (page / imageFiles.length);
        setDisplayPoints(percentage_vertices);
        scrollToAttribute("image-box", "image-div", scrollTop, imageFiles);
      } else {
        setDisplayPoints(null);
      }
    }
  }, [imageFiles, displayKeyIndex, displayKeySubattributeIndex]);
    

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
    updateFieldCoordinates(fieldId, new_coordinates, pageNumber);
    setTimeout(() => {
      setDisplayKeyIndex(fieldId.primaryIndex);
      setDisplayKeySubattributeIndex(fieldId.subIndex || null);
      setDisplayPoints(coordinatesDecimalsToPercentage(new_coordinates));
    }, 0);
  };

  const handleToggleHotkeys = (event: React.MouseEvent<HTMLButtonElement>) => {
    setHotkeysAnchor(event.currentTarget);
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
                          <p style={{marginTop: "24px"}}>
                            {/* Automatically Clean Fields 
                                    <Switch checked={autoCleanFields} onChange={() => setAutoCleanFields(!autoCleanFields)} size='small'/> */}
                          </p>
                          <p>
                                    Raw Values 
                            <Switch checked={showRawValues} onChange={() => setShowRawValues(!showRawValues)} size='small'/>
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
                          <AttributesTable 
                            attributesList={attributesList}
                            handleClickField={handleClickField}
                            fullscreen={fullscreen}
                            forceOpenSubtable={forceOpenSubtable}
                            displayKeyIndex={displayKeyIndex}
                            displayKeySubattributeIndex={displayKeySubattributeIndex}
                            showRawValues={showRawValues}
                            setUpdateFieldLocationID={setUpdateFieldLocationID}
                            {...attributeTableProps}
                          />
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
                          <IconButton id='fullscreen-image-button' onClick={() => handleSetFullscreen("image")}>
                            { 
                              fullscreen === "image" ? <FullscreenExitIcon/> : <FullscreenIcon/> 
                            }
                          </IconButton>
                        </Box>
                        <Box id="image-box" sx={styles.imageBox}>
                                
                          {imageFiles &&
                                imageFiles.map((imageFile, idx) => (
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
                                ))
                                
                          }
                        </Box>
                      </Box>
                    </Grid>
        }
                
      </Grid>
    </Box>
  );
};

export default DocumentContainer;
