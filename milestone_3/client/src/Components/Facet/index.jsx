import React, { useState } from 'react';
import { Checkbox, FormControlLabel, Grid, Stack, Typography } from '@mui/material';
import { FixedSizeList as List } from "react-window";
import InfiniteLoader from "react-window-infinite-loader";

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

export default function Facet({ title, buckets }) {
  // const [selected, setSelected] = useState([])

  // const handleChange = (event) => {
  //   setSelected(typeof event.target.value === 'string' ? event.target.value.split(',') : event.target.value);
  // };

  function FacetItem({ index, style }) {
    const value = buckets[index].val
    const count = buckets[index].count
    return (
      <div style={style}>
        <FormControlLabel
          control={<Checkbox />}
          label={
            <Stack direction="row" spacing={0.5}>
              <Typography variant="body1" color="secondary" sx={{textTransform: 'capitalize'}}>{value}</Typography>
              {itemStatusMap[index] === LOADED && <Typography variant="button" color="primary">({count})</Typography>}
            </Stack>
          } 
        />
      </div>
    );
  }

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
              // style={{height:"content", maxHeight:"10em"}}
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