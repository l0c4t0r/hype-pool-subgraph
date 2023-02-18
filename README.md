# Gamma Strategies Hype Pool Subgraph
This subgraph tracks important state variables in Gamma Strategies hypervisors and underlying pools. This data can be used to calculated uncollected fees and yield of the hypervisors.

## Fast Sync
To enable fast sync, in `/src/helpers/config.ts` set `FAST_SYNC = true` and set `FAST_SYNC_BLOCK` to the block with which you want the subgraph to skip to. 
Fast Sync functionality is a way to delaying pool template initiation until a specified block. This saves a lot of time with the sync by bypassing all pool events until `FAST_SYNC_BLOCK`, and may be a desirable way to sync the subgraph if historical data is secondary. On the first hypervisor event that triggers after `FAST_SYNC_BLOCK`, the subgraph will initialize all associated pools, and do a full refresh on the data.

A common workflow would be to use fast sync to bring the subgraph up to the current block height, and then initiate a normal sync to backfill data in the background.

