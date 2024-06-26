import { useState, useEffect } from 'react';
import { useParams } from "react-router-dom";
import { Grid, Box, IconButton } from '@mui/material';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import FullscreenExitIcon from '@mui/icons-material/FullscreenExit';
import { ImageCropper } from '../ImageCropper/ImageCropper';
import { useKeyDown } from '../../assets/helperFunctions';
import AttributesTable from '../RecordAttributesTable/RecordAttributesTable';

const styles = {
    imageBox: {
        height: "70vh",
        overflowX: "scroll",
    },
    image: {
        height: "50vh"
    },
    gridContainer: {
        backgroundColor: "white",
    },
    containerActions: {
        display: 'flex',
        justifyContent: 'flex-end',
        marginRight:'10px',
    },
    outerBox: {
        paddingBottom: "45px"
    },
}


export default function DocumentContainer(props) {
    const { imageFiles, attributesList, handleChangeValue, handleUpdateRecord } = props;
    const [ imgIndex, setImgIndex ] = useState(0)
    const [ displayPoints, setDisplayPoints ] = useState(null)
    const [ displayKey, setDisplayKey ] = useState(null)
    const [ displayKeyIndex, setDisplayKeyIndex ] = useState(null)
    const [ displayKeySubattributeIndex, setDisplayKeySubattributeIndex ] = useState(null)
    const [ fullscreen, setFullscreen ] = useState(null)
    const [ gridWidths, setGridWidths ] = useState([5.9,0.2,5.9])
    const [ width, setWidth ] = useState("100%")
    const [ height, setHeight ] = useState("auto")
    const [ forceOpenSubtable, setForceOpenSubtable ] = useState(null)
    const [ imageHeight, setImageHeight ] = useState(0)
    const imageDivStyle={
        width: width,
        height: height,
    }
    let params = useParams(); 

    useEffect(() => {
        if (displayKeyIndex && displayKeySubattributeIndex) {
            // console.log(attributesList[displayKeyIndex].subattributes[displayKeySubattributeIndex])
            let newImgIdx = attributesList[displayKeyIndex].subattributes[displayKeySubattributeIndex].page
            if (newImgIdx !== undefined && newImgIdx !== null) setImgIndex(newImgIdx)
        } 
        else if (displayKeyIndex) {
            // console.log(attributesList[displayKeyIndex])
            let newImgIdx = attributesList[displayKeyIndex].page
            if (newImgIdx !== undefined && newImgIdx !== null) setImgIndex(newImgIdx)
        }
        else {
            setImgIndex(0)
        }
        
    },[displayKeyIndex, displayKeySubattributeIndex])

    useEffect(() => {
        if (imageFiles && imageFiles.length > 0) {
            let img = new Image();

            img.onload = function(){
                let height = img.height;
                // let width = img.width;
                setImageHeight(height)
            }

            img.src = imageFiles[0];
        }
    })

    useEffect(() => {
        setDisplayPoints(null)
        setDisplayKey(null)
        setDisplayKeyIndex(null)
    },[params.id])

    const tabCallback = () => {
        let tempIndex
        let tempSubIndex
        let isSubattribute
        let tempKey
        let tempVertices
        if (displayKeyIndex === null) {
            tempIndex = 0
            tempSubIndex = null
        } 
        else if (attributesList[displayKeyIndex].subattributes) {
            // check if subattribute idx has not been set -> set it
            // check if subattribute idx has reached the max -> reset it, increment primary index (unless we reached the max there)
            // otherwise set subattribute idx to 0
            if (displayKeySubattributeIndex === null || displayKeySubattributeIndex === undefined) {
                tempSubIndex = 0
                tempIndex = displayKeyIndex
            } else if(displayKeySubattributeIndex === attributesList[displayKeyIndex].subattributes.length - 1) {
                tempSubIndex = null
                if (displayKeyIndex === attributesList.length - 1) tempIndex = 0
                else tempIndex = displayKeyIndex + 1
            } else { 
                tempSubIndex = displayKeySubattributeIndex + 1
                tempIndex = displayKeyIndex
            }
        }
        else if (displayKeyIndex === attributesList.length - 1)  {
            tempIndex = 0
            tempSubIndex = null
        }
        else {
            tempIndex = displayKeyIndex + 1
            tempSubIndex = null
        }

        if (tempSubIndex !== null && tempSubIndex !== undefined) {
            isSubattribute = true
            tempKey = attributesList[tempIndex].subattributes[tempSubIndex].key
            tempVertices = attributesList[tempIndex].subattributes[tempSubIndex].normalized_vertices
        } else {
            isSubattribute = false
            tempKey = attributesList[tempIndex].key
            tempVertices = attributesList[tempIndex].normalized_vertices
        }
        handleClickField(tempKey, tempVertices, tempIndex, isSubattribute, tempSubIndex)
        let elementId

        let topLevelAttribute = attributesList[tempIndex].key
        if (isSubattribute) {
            setForceOpenSubtable(tempIndex)
            elementId = `${tempIndex}::${tempSubIndex}`
        } 
        else elementId = `${tempKey}::${tempIndex}`
        let element = document.getElementById(elementId)
        let waitTime = 0
        let containerElement = document.getElementById("table-container")
        if (element) {
            if (isSubattribute) {
                setTimeout(function() {
                    element.scrollIntoView({ behavior: "smooth", block: "end", inline: "nearest" })
                }, waitTime)
            }
            else scrollIntoView(element, containerElement)
        } else // element likely has not rendered yet. wait 250 milliseconds then try again
        {
            waitTime = 250
            setTimeout(function() {
                element = document.getElementById(elementId)
                if (element) element.scrollIntoView({ behavior: "smooth", block: "end", inline: "nearest" })
            }, waitTime)
        }
    }

    const shiftTabCallback = () => {
        let tempIndex
        let tempSubIndex
        let isSubattribute
        let tempKey
        let tempVertices
        if (displayKeyIndex === null) {
            tempIndex = attributesList.length-1
            tempSubIndex = null
        } 
        else if (attributesList[displayKeyIndex].subattributes) {
            if (displayKeySubattributeIndex === null || displayKeySubattributeIndex === undefined) {
                tempSubIndex = attributesList[displayKeyIndex].subattributes.length-1
                tempIndex = displayKeyIndex
            } else if(displayKeySubattributeIndex === 0) {
                tempSubIndex = null
                if (displayKeyIndex === 0) tempIndex = attributesList.length-1
                else tempIndex = displayKeyIndex - 1
            } else { 
                tempSubIndex = displayKeySubattributeIndex - 1
                tempIndex = displayKeyIndex
            }
        }
        else if (displayKeyIndex === 0)  {
            tempIndex = tempIndex = attributesList.length-1
            tempSubIndex = null
        }
        else {
            tempIndex = displayKeyIndex - 1
            tempSubIndex = null
        }

        if (tempSubIndex !== null && tempSubIndex !== undefined) {
            isSubattribute = true
            tempKey = attributesList[tempIndex].subattributes[tempSubIndex].key
            tempVertices = attributesList[tempIndex].subattributes[tempSubIndex].normalized_vertices
        } else {
            isSubattribute = false
            tempKey = attributesList[tempIndex].key
            tempVertices = attributesList[tempIndex].normalized_vertices
        }
        handleClickField(tempKey, tempVertices, tempIndex, isSubattribute, tempSubIndex)
        let elementId

        let topLevelAttribute = attributesList[tempIndex].key
        if (isSubattribute) {
            setForceOpenSubtable(tempIndex)
            elementId = `${tempIndex}::${tempSubIndex}`
        } 
        else elementId = `${tempKey}::${tempIndex}`
        let element = document.getElementById(elementId)
        let waitTime = 0
        let containerElement = document.getElementById("table-container")
        if (element) {
            if (isSubattribute) {
                setTimeout(function() {
                    element.scrollIntoView({ behavior: "smooth", block: "end", inline: "nearest" })
                }, waitTime)
            }
            else scrollIntoView(element, containerElement)
        } else // element likely has not rendered yet. wait 250 milliseconds then try again
        {
            waitTime = 250
            setTimeout(function() {
                element = document.getElementById(elementId)
                if (element) element.scrollIntoView({ behavior: "smooth", block: "end", inline: "nearest" })
            }, waitTime)
        }
    }

    useKeyDown("Tab", tabCallback, shiftTabCallback, null, null);
    useKeyDown("ArrowUp", shiftTabCallback, null, null, null);
    useKeyDown("ArrowDown", tabCallback, null, null, null);

    // const handleClickField = (key, normalized_vertices, isSubattribute, topLevelAttribute, subattributeIdx, newIdx) => {
    const handleClickField = (key, normalized_vertices, primaryIndex, isSubattribute, subattributeIdx) => {
        if (!key || (!isSubattribute && primaryIndex === displayKeyIndex) || (isSubattribute && primaryIndex === displayKeyIndex && subattributeIdx === displayKeySubattributeIndex)) {
            setDisplayPoints(null)
            setDisplayKey(null)
            setDisplayKeyIndex(null)
        }
        else {
            setDisplayKey(key)
            setDisplayKeyIndex(primaryIndex)
            setDisplayKeySubattributeIndex(subattributeIdx)
            if(normalized_vertices !== null && normalized_vertices !== undefined) {
                let percentage_vertices = []
                for (let each of normalized_vertices) {
                    percentage_vertices.push([each[0]*100, each[1]*100])
                }
                // get page
                let page = 0
                try {
                    let attr = attributesList[primaryIndex]
                    if (isSubattribute) attr=attr.subattributes[subattributeIdx]
                    if (attr.page !== undefined) page = attr.page
                } catch (e) {
                    console.log("error getting page")
                    console.log(e)
                }
                // percentage from the top we should scroll down
                // the y vertex of the element is relative to its page, so divide this by the amount of pages
                // we then add the page number, but again divide by the amount of pages because this is a percentage
                let scrollTop = (normalized_vertices[2][1] / imageFiles.length)
                scrollTop += (page / imageFiles.length)
                setDisplayPoints(percentage_vertices)
                scrollToAttribute("image-box", "image-div", scrollTop)
            } else {
                setDisplayPoints(null)
            }
        }
    }

    const scrollToAttribute = (boxId, heightId, top) => {
        let imageContainerId = boxId
        let imageContainerElement = document.getElementById(imageContainerId)
        let imageElement = document.getElementById(heightId)
        let scrollAmount = top * imageElement.clientHeight * imageFiles.length
        // we're scrolling this amount from the top, so subtract 100 to ensure highlighted box isnt cut off
        scrollAmount -=100
        if (imageContainerElement) {
            imageContainerElement.scrollTo({
                    top: scrollAmount,
                    behavior: "smooth",
                });
        }
    }

    function scrollIntoView(element, container) {
        if (element && container) {
            var containerTop = container.scrollTop;
            var containerBottom = containerTop + container.clientHeight; 
            var elemTop = element.offsetTop;
            var elemBottom = elemTop + element.clientHeight;
            if (elemTop < containerTop) {
                container.scrollTo({
                    top: elemTop,
                    behavior: "smooth",
                });
            } else if (elemBottom > containerBottom) {
                container.scrollTo({
                    top: elemBottom - container.clientHeight,
                    behavior: "smooth",
                });
            }
        }
        
      }


    const handleSetFullscreen = (item) => {
        if (fullscreen === item)  {
            setGridWidths([5.9,0.2,5.9])
            setFullscreen(null)
        }
        else { 
            setFullscreen(item)
            if (item === "image") setGridWidths([12, 0, 0])
            else if (item === "table") setGridWidths([0, 0, 12])
        }
    }

    return (
        <Box style={styles.outerBox}>
            <Grid container>
                {
                    fullscreen !== "image" && 
                    <Grid item xs={gridWidths[2]}>
                        <Box sx={styles.gridContainer}>
                            <Box sx={styles.containerActions}>
                                <IconButton onClick={() => handleSetFullscreen("table")}>
                                    { 
                                        fullscreen === "table" ? <FullscreenExitIcon/> : <FullscreenIcon/> 
                                    }
                                </IconButton>
                            </Box>
                            {attributesList !== undefined && 
                                <AttributesTable 
                                    attributesList={attributesList}
                                    handleClickField={handleClickField}
                                    handleChangeValue={handleChangeValue}
                                    fullscreen={fullscreen}
                                    forceOpenSubtable={forceOpenSubtable}
                                    displayKeyIndex={displayKeyIndex}
                                    displayKeySubattributeIndex={displayKeySubattributeIndex}
                                    handleUpdateRecord={handleUpdateRecord}
                                />
                            }
                        </Box>
                    </Grid>
                }
                <Grid item xs={gridWidths[1]}></Grid>
                {fullscreen !== "table" && 
                    <Grid item xs={gridWidths[0]}>
                        <Box sx={styles.gridContainer}>
                            <Box sx={styles.containerActions}>
                                <IconButton onClick={() => handleSetFullscreen("image")}>
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

}