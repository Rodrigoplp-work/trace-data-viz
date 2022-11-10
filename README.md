# Trace Extension alternative implementation

This is an alternative implementation of [theia-trace-extension](https://github.com/theia-ide/theia-trace-extension) using SvelteKit and D3.

## Objectives of the project

### Show that new frameworks offer alternatives to the assumptions made when planning theia-trace-extension, and these alternatives work;

As proof of concept a project was built with Svelte and D3, implementing the XY and the Resources chart with SVG elements. These choices allow:

- More efficient use of the DOM, as it does not use virtualDOM;
- Easier manipulation of data throughout the application, facilitating synchronization between charts and the building of new useful features for the user;
- Smaller code-base.

### Try to perform less zooming in the back-end, perhaps adopting a pagination model as the one used in the resources chart. This could be achieved by optimization of data handling in the front-end;

As of now, zooming on the xy chart generates incremental calls to the back-end that could become a performance bottleneck in production.

A more efficient front-end should be capable of managing more data and decreasing the number of calls to the back-end.

### Avoid locking the project into old dependencies.

Theia imposes a list of dependencies to which every application must abide by. This makes it more difficult to adopt new features provided by the JavaScript community, hindering the development of our own applications.

## Installation

Download the Trace Compass server and start it.

Clone this repository.

Then, at the root of the project do:

```
npm i
npm run dev
```
