![plentymarkets Logo](http://www.plentymarkets.eu/layout/pm/images/logo/plentymarkets-logo.jpg)

# plentyDevTool Contribution Guide

Thank you for considering contributing to plentyDevTool! Whether you want to add a new feature, fix a bug, improve our code base, or raise the quality of our documentation, we really appreciate it. Likewise, we appreciate the time and effort you take to report issues you encounter.

This document discusses the contribution process and related topics.

## Background

plentyDevTool is a tool for developing plugins for plentymarkets, an e-commerce ERP by plentysystems AG. plentyDevTool uses Angular and Electron. If you want to contribute and aren't familiar with these frameworks, here are some resources to get you started:

* [Angular Tour of Heroes](https://angular.io/tutorial)
* [Electron Quick Start](https://www.electronjs.org/docs/latest/tutorial/quick-start)

Refer to this repository's README for processes specific to plentyDevTool and the docs for usage documentation.

## Submitting an Issue

We use the [plentyDevTool category in our forum](https://forum.plentymarkets.com/c/plugin-entwicklung/plentydevtool/442) to keep track of issues. You can also find a reference with links to the different forum threads in the [issues section on GitHub](https://github.com/plentymarkets/plentyDevTool/issues).

Whenever you want to report an issue, take a moment to make sure the issue doesn't already exist. Please include closed issues in your search, in case it's already been addressed. If you cannot find a report associated with your issue, please follow these guidelines for submitting a new issue:

1. Open a new thread in the [plentyDevTool forum](https://forum.plentymarkets.com/c/plugin-entwicklung/plentydevtool/442).
2. Use an actionable title that identifies the behaviour you want, such as "Add possibility to trigger a full build".
3. Add a description that explains your use case and why this behavior will help you achieve your goal.
4. Indicate if you are going to work on resolving the issue yourself.

When submitting bug reports, please also include the following information:

- the version(s) in which the bug appears
- the OS you're using and its version
- the date when you first encountered the bug
- a detailed description of the faulty behaviour you've encountered
- an outline of the expected behaviour
- (if applicable) screenshots or animated GIFs of the faulty behaviour
- (if applicable) error notifications from developers tools 

## Communication

To ensure that the features and bug fixes you submit are in line with the vision of the product and adhere to our quality and security standards, we ask that you discuss larger contributions with us ahead of time. This also means that we can better collaborate on your ideas, making it all the more likely that we can accept your contribution in the end.

To talk with us about your planned contributions, please open a new thread
[in the plentyDevTool category in our forum](https://forum.plentymarkets.com/c/plugin-entwicklung/plentydevtool/442). Tag the new post with the **Contribution** tag and briefly explain what you're planning to do and how you want to go about. Our developers will then give you feedback.

## Submitting a Pull Request

1. Fork the plentyDevTool repository on GitHub by clicking the **Fork** button in the upper right corner.
2. [Clone](https://git-scm.com/book/en/v2/Git-Basics-Getting-a-Git-Repository) the forked repository.
3. Create a new **branch** for implementing your changes. Make sure to give your branch an appropriate name by following these naming conventions:
- Branches for bug fixes should always begin with the prefix **fix** and a slash, e.g. `fix/disabled_button`.
- Branches for features should always begin with the prefix **feature** and a slash, e.g. `feature/confirmation_overlay`.
4. Make your changes (e.g. a bug fix) in the cloned repository.
5. Once you are done, **commit** your changes to the branch you created.
6. Create a pull request. Always create pull requests against the **main** branch.
7. Use the appropriate labels on GitHub (e.g. **documentation** if your PR includes text).
8. Add a few sentences that describe the changes you've made in the description of the pull request.

After you've opened a pull requests, the PR will be subject to our automated tests. If one or more of the checks is failing, please consider the proposed adjustments to your pull request. If it's unclear why the test failed, either mention **@plentymarkets-plugin-core** in the PR's conversation or **@plenty-plugin-core** in the forum.
