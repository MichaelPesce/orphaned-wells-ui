import React, { useState, MouseEvent } from 'react';
import { Button, Menu, MenuItem, Checkbox, Box, TextField, IconButton } from '@mui/material';
import { Select, FormControl, InputLabel, Grid, ListItemText, Badge, SelectChangeEvent } from '@mui/material';
import FilterListIcon from '@mui/icons-material/FilterList';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import RefreshIcon from '@mui/icons-material/Refresh';
import Draggable from 'react-draggable';
import ApprovalIcon from '@mui/icons-material/Approval';
import { DEFAULT_FILTER_OPTIONS } from '../../util';
import { FilterOption, TableFiltersProps } from '../../types';
import { TableFiltersStyles as styles } from '../../styles';

const TableFilters = ({ applyFilters, appliedFilters, filter_options }: TableFiltersProps) => {
    
    const [anchorFilterMenu, setAnchorFilterMenu] = useState<null | HTMLElement>(null);
    const [currentFilters, setCurrentFilters] = useState<FilterOption[]>(appliedFilters);
    const [availableFilters, setAvailableFilters] = useState(filter_options || DEFAULT_FILTER_OPTIONS)
    const openFilterMenu = Boolean(anchorFilterMenu);

    const handleOpenFilters = (event: MouseEvent<HTMLElement>) => {
        setAnchorFilterMenu(event.currentTarget);
    };
    const handleClose = () => {
        setAnchorFilterMenu(null);
    };

    const updateCurrentFilters = (idx: number, field: string, newValue: any) => {
        let tempFilters = [...currentFilters];
        let tempFilter = { ...tempFilters[idx] };
        if (field === 'filter') {
            let updatedValue = structuredClone(availableFilters[newValue]);
            tempFilter = updatedValue;
        } else if (field === 'operator') {
            tempFilter['operator'] = newValue;
        } else if (field === 'value') {
            if (tempFilter.type === 'checkbox') {
                let options = tempFilter.options!;
                let option = options.find((element) => element.name === newValue);
                option!.checked = !option!.checked;
                let selectedOptions = tempFilter.selectedOptions!;
                let idx = selectedOptions.indexOf(newValue);
                if (idx === -1) selectedOptions.push(newValue);
                else selectedOptions.splice(idx, 1);
            } else {
                tempFilter['value'] = newValue;
            }
        }

        tempFilters[idx] = tempFilter;
        setCurrentFilters(tempFilters);
    }

    const addNewFilter = () => {
        let tempFilters = [...currentFilters];
        tempFilters.push(structuredClone(availableFilters['review_status']));
        setCurrentFilters(tempFilters);
    }

    const removeFilter = (idx: number) => {
        let tempFilters = [...currentFilters];
        tempFilters.splice(idx, 1);
        setCurrentFilters(tempFilters);
    }

    const removeAllFilters = () => {
        setCurrentFilters([]);
        applyFilters([]);
    }

    const handleApplyFilters = () => {
        applyFilters(currentFilters);
        handleClose();
    }

    return (
        <div>
            <Button
                id="filter-button"
                aria-controls={openFilterMenu ? 'filter-menu' : undefined}
                aria-haspopup="true"
                aria-expanded={openFilterMenu ? 'true' : undefined}
                onClick={handleOpenFilters}
                startIcon={
                    <Badge badgeContent={appliedFilters.length} color="primary">
                        <FilterListIcon />
                    </Badge>
                }
            >
                Filters
            </Button>
            {
                <Draggable handle="#filter-menu">
                    <Menu
                        id="filter-menu"
                        anchorEl={anchorFilterMenu}
                        open={openFilterMenu}
                        onClose={handleClose}
                        MenuListProps={{
                            'aria-labelledby': 'filter-button',
                        }}
                    >
                        <IconButton
                            aria-label="close"
                            onClick={() => handleClose()}
                            sx={styles.closeIcon}
                        >
                            <CloseIcon />
                        </IconButton>
                        <Box p={2} sx={styles.box}>
                            <Button onClick={addNewFilter} startIcon={<AddIcon />}>New Filter</Button>
                            <Button onClick={removeAllFilters} startIcon={<RefreshIcon />}>Reset Filters</Button>
                        </Box>
                        {
                            currentFilters.map((filter, idx) => (
                                <Box key={idx} sx={styles.tableFilter}>
                                    <TableFilter
                                        thisFilter={currentFilters[idx]}
                                        updateCurrentFilters={updateCurrentFilters}
                                        operator={filter.operator}
                                        idx={idx}
                                        removeFilter={removeFilter}
                                        availableFilters={availableFilters}
                                    />
                                </Box>
                            ))
                        }

                        <Box sx={{ display: 'flex', justifyContent: 'space-around', paddingBottom: 2 }}>
                            <Button
                                onClick={handleApplyFilters}
                                variant='contained'
                                startIcon={<ApprovalIcon />}
                            >
                                Apply Filters
                            </Button>
                        </Box>
                    </Menu>
                </Draggable>
            }
        </div>
    );
}

interface TableFilterProps {
    thisFilter: FilterOption;
    updateCurrentFilters: (idx: number, field: string, newValue: any) => void;
    operator: string;
    idx: number;
    removeFilter: (idx: number) => void;
    availableFilters: {[key: string]: FilterOption};
}

const TableFilter = (props: TableFilterProps) => {
    const { thisFilter, updateCurrentFilters, operator, idx, removeFilter, availableFilters } = props;

    const styles = {
        menuContainer: {
            // width: "50vw",
        },
        filterTitle: {
            fontWeight: "bold",
            fontSize: "16px",
            margin: "10px"
        },
    }

    const handleUpdateCheckbox = (name: string) => {
        updateCurrentFilters(idx, 'value', name);
    }

    const handleChange = (e: React.ChangeEvent<{ value: unknown }>, field: string) => {
        updateCurrentFilters(idx, field, e.target.value);
    }

    const handleSelectChange = (e: SelectChangeEvent<string>, field: string) => {
        updateCurrentFilters(idx, field, e.target.value);
    }

    return (
        <Grid sx={styles.menuContainer} container px={2} spacing={2}>
            <Grid item xs={4} sx={{ display: 'flex', justifyContent: 'flex-start' }}>
                <IconButton sx={{ mr: 1 }} onClick={() => removeFilter(idx)}>
                    <CloseIcon />
                </IconButton>
                <FormControl variant="standard" fullWidth>
                    <InputLabel id="column-select-label">Column</InputLabel>
                    <Select
                        labelId="column-select-label"
                        id="column-select"
                        value={thisFilter.key}
                        label="Column"
                        onChange={(e) => handleSelectChange(e, 'filter')}
                    >
                        {Object.entries(availableFilters).map(([key, filter]) => (
                            <MenuItem key={key} value={key}>{filter.displayName}</MenuItem>
                        ))}
                    </Select>
                </FormControl>
            </Grid>

            <Grid item xs={2}>
                <FormControl variant="standard" fullWidth>
                    <InputLabel id="operator-select-label">Operator</InputLabel>
                    <Select
                        labelId="operator-select-label"
                        id="operator-select"
                        value={operator}
                        label="Operator"
                        onChange={(e) => handleSelectChange(e, 'operator')}
                    >
                        {
                            thisFilter.type === 'checkbox' ?
                                [
                                    <MenuItem key={'checkbox1'} value={"equals"}>Equals</MenuItem>
                                ]
                                :
                                thisFilter.type === 'string' ?
                                    [
                                        <MenuItem key={'string1'} value={"equals"}>Equals</MenuItem>,
                                        <MenuItem key={'string2'} value={"contains"}>Contains</MenuItem>
                                    ]
                                    :
                                    thisFilter.type === 'date' &&
                                    [
                                        <MenuItem key={'date1'} value={"is"}>Is</MenuItem>,
                                        <MenuItem key={'date2'} value={"before"}>Is Before</MenuItem>,
                                        <MenuItem key={'date3'} value={"after"}>Is After</MenuItem>
                                    ]
                        }
                    </Select>
                </FormControl>
            </Grid>

            <Grid item xs={6}>
                {
                    thisFilter.type === 'checkbox' ?
                        <FormControl variant="standard" fullWidth>
                            <InputLabel id="values-checkbox-label">Values</InputLabel>
                            <Select
                                labelId="values-checkbox-label"
                                id="values-checkbox"
                                multiple
                                value={thisFilter.selectedOptions}
                                label="Values"
                                renderValue={(selected) => selected.join(', ')}
                            >
                                {thisFilter.options!.map((option) => (
                                    <MenuItem
                                        key={option.name}
                                        value={option.name}
                                        onClick={() => handleUpdateCheckbox(option.name)}
                                    >
                                        <Checkbox checked={option.checked} />
                                        <ListItemText primary={option.name} />
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl> :
                        thisFilter.type === 'string' ?
                            <Box
                                component="form"
                                noValidate
                                autoComplete="off"
                            >
                                <TextField
                                    id="string-value"
                                    label="Value"
                                    variant="standard"
                                    onChange={(e) => handleChange(e, 'value')}
                                    value={thisFilter.value}
                                />
                            </Box> :
                            thisFilter.type === 'date' &&
                            <TextField
                                inputProps={{
                                    "className": "date-filter-input",
                                    "step": 1,
                                }}
                                InputLabelProps={{ shrink: true }}
                                type="date"
                                label="Date"
                                variant="standard"
                                onChange={(e) => handleChange(e, 'value')}
                                value={thisFilter.value}
                            />
                }
            </Grid>
        </Grid>
    );
}

export default TableFilters;