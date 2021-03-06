import React, { useContext, useState } from 'react';
import { Checkbox, FormControlLabel, Grid, Typography } from '@mui/material';
import { FixedSizeList as List } from "react-window";
import InfiniteLoader from "react-window-infinite-loader";
import { SearchContext } from '../../Context/SearchContext';

const LOADED = 2;
let itemStatusMap = {};

const isItemLoaded = (index) => !!itemStatusMap[index];
const loadMoreItems = (startIndex, stopIndex) => {
  return new Promise((resolve) => {
      for (let index = startIndex; index <= stopIndex; index++) {
        itemStatusMap[index] = LOADED;
      }
      resolve();
    }
  );
};

export default function Facet({ title, handleFilters, buckets }) {
  const { query } = useContext(SearchContext)
  const [selected, setSelected] = useState([])

  const handleChange = async (event) => {
    let newSelected;

    if (event.target.checked)
      newSelected = [...selected, event.target.value]
    else
      newSelected = [...selected].filter(e => e !== event.target.value)
      
    handleFilters(title, newSelected)
    setSelected(newSelected)
  };

  function FacetItem({ index, style }) {
    const name = buckets[index].name
    const value = buckets[index].val
    const count = buckets[index].count
    
    return (
      <FormControlLabel
        style={style}
        control={<Checkbox value={value} checked={selected.indexOf(value) !== -1} onChange={handleChange}/>}
        label={
          <Typography variant="body1" color="secondary" sx={{textTransform: 'capitalize'}}>
            { name ? name : value}
            <Typography variant="button" sx={{ marginLeft: '0.5em' }} color="primary">
              {count}
            </Typography>
          </Typography>
        } 
      />
    );
  }

  React.useEffect(() => {
    setSelected([])
  }, [query])

  return (
    <Grid container item xs={12}>
      <Grid item xs={12}>
        <Typography variant="button" id={title} color="secondary">{title}</Typography>
      </Grid>
      
      <Grid container item xs={12} sx={{ overflowX: 'hidden' }}>
        <InfiniteLoader
          isItemLoaded={isItemLoaded}
          itemCount={buckets.length}
          loadMoreItems={loadMoreItems}
        >
          {({ onItemsRendered, ref }) => (
            <List
              className="List"
              height={42*Math.min(5, buckets.length)}
              itemCount={buckets.length}
              itemSize={42}
              onItemsRendered={onItemsRendered}
              ref={ref}
              width={300}
            >
              {FacetItem}
            </List>
          )}
        </InfiniteLoader>
      </Grid>
    </Grid>
  );
}