import * as React from "react";
import { Button, ButtonGroup, ClickAwayListener, Grow, Paper } from "@mui/material";
import { Popper, MenuItem, MenuList } from "@mui/material";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import { useEffect } from "react";

interface Option {
    text: string;
    icon: React.ReactNode;
    onClick: () => void;
}

interface SplitButtonProps {
    options: Option[];
    disabled?: boolean;
}

const SplitButton = ({ options, disabled }: SplitButtonProps) => {
  const [open, setOpen] = React.useState(false);
  const anchorRef = React.useRef<HTMLDivElement>(null);
  const [selectedIndex, setSelectedIndex] = React.useState(0);

  useEffect(() => {
    if (selectedIndex >= options.length) setSelectedIndex(0);
  }, [options]);

  const handleClick = () => {
    options[selectedIndex].onClick();
  };

  const handleMenuItemClick = (index: number) => {
    setSelectedIndex(index);
    setOpen(false);
  };

  const handleToggle = () => {
    setOpen((prevOpen) => !prevOpen);
  };

  const handleClose = (event: MouseEvent | TouchEvent) => {
    if (anchorRef.current && anchorRef.current.contains(event.target as Node)) {
      return;
    }
    setOpen(false);
  };
  if (options.length > 0 && selectedIndex < options.length) return (
    <React.Fragment>
      <ButtonGroup
        variant="outlined"
        ref={anchorRef}
        disabled={disabled}
      >
        <Button startIcon={options[selectedIndex].icon} onClick={handleClick}>{options[selectedIndex].text}</Button>
        <Button
          size="small"
          aria-controls={open ? "split-button-menu" : undefined}
          aria-expanded={open ? "true" : undefined}
          aria-label="select merge strategy"
          aria-haspopup="menu"
          onClick={handleToggle}
        >
          <ArrowDropDownIcon />
        </Button>
      </ButtonGroup>
      <Popper
        sx={{
          zIndex: 1,
        }}
        open={open}
        anchorEl={anchorRef.current}
        role={undefined}
        transition
        disablePortal
      >
        {({ TransitionProps, placement }) => (
          <Grow
            {...TransitionProps}
            style={{
              transformOrigin:
                                placement === "bottom" ? "center top" : "center bottom",
            }}
          >
            <Paper>
              <ClickAwayListener onClickAway={handleClose}>
                <MenuList id="split-button-menu" autoFocusItem>
                  {options.map((option, index) => (
                    <MenuItem
                      key={option.text}
                      onClick={() => handleMenuItemClick(index)}
                    >
                      {option.icon}&nbsp;&nbsp;
                      {option.text}
                    </MenuItem>
                  ))}
                </MenuList>
              </ClickAwayListener>
            </Paper>
          </Grow>
        )}
      </Popper>
    </React.Fragment>
  ); else return <span></span>;
};

export default SplitButton;