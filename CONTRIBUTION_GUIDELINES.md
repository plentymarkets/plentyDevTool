![plentymarkets Logo](http://www.plentymarkets.eu/layout/pm/images/logo/plentymarkets-logo.jpg)

# PlentyDevTool Contribution Guide

## Do you want to contribute to the development of PlentyDevTool?

PlentyDevTool is an open source project. As a part of our community, you can add features, help fixing bugs, or improve our codebase.
To do so, you will need to open a pull request on GitHub, which our developers will then assess and, if everything is all right, approve and merge.
This document outlines the requirements for your contributions.
Thanks a lot for being a part of our community!

## Talk to us

Whether you're planning to contribute a feature or fix a bug, we will have to assess your code and decide whether or not we can include it in a future release.
We don't want you to invest a lot of time and effort into a contribution that we cannot accept.

That is why you should talk to us before you begin working on a larger contribution to PlentyDevTool. Just open a new thread
[in the PlentyDevTool category in the forum](https://forum.plentymarkets.com/c/plugin-entwicklung/plentydevtool/442).
Tag the new post with the tag **Contribution**. Briefly explain what you're planning to do and how you would go about.
Our developers will have a look at your input and contact you to discuss whether it's possible or not.

## Which contributions will not be accepted?

It's hard to say. Mainly, we reserve the right to reject your contribution if it does not meet the standards we set for ourselves.
This includes, for instance, sloppy code formatting or negligence of security issues.

## Contributing bug fixes

If you want to help improve PlentyDevTool by contributing bug fixes, you can find a list of all currently known bugs in the [issues column on GitHub](https://github.com/plentymarkets/plentyDevTool/issues).
Each individual entry on the issues board includes a link to the corresponding thread in the forum, if you need further information.

If you find a bug that's not on the GitHub issues board, let us know by opening a new thread [in the plentyDevTool category in the forum](https://forum.plentymarkets.com/c/plugin-entwicklung/plentydevtool/442).
Include detailed information on how to reproduce the bug. This includes:

- the version(s) in which the bug appears
- the OS you're using and its version
- the date when you first encountered the bug
- a detailed description of the faulty behaviour you've encountered and an outline of which behaviour you would have expected
- (if applicable) screenshots or animated GIFs of the faulty behaviour
- (if applicable) error notifications from developers tools 

If you're willing to take on the bug fix yourself, please let us know that you are working on it.

## Improving the codebase

While we're always striving to improve the code documentation in the project, there's still much to be done.
If you encounter a method that has not been documented properly and want to contribute helpful code comments, you can open a pull request as described below.

## How to do it

1. Fork the PlentyDevTool repository on GitHub by clicking the **Fork** button in the upper right corner.
2. [Clone](https://git-scm.com/book/en/v2/Git-Basics-Getting-a-Git-Repository) the forked repository.
3. Create a new **branch** on which you will implement your changes.
4. Make sure to name the branch adequately.
5. Make your changes (e.g. a bug fix) in the cloned repository.
6. Once you are done, **commit** your changes to the branch you created.
7. Create a pull request. Always create pull requests against our **main** branch!
8. Use the appropriate labels on GitHub (e.g. **Translations required** if your PR includes text).
9. Add a few sentences that describe the changes you've made in the description of the pull request.

After you've opened a pull requests, the PR will be subject to our automated tests. If one or more of the checks is failing,
please consider the proposed adjustments to your pull request. If it's unclear why the test failed, make sure to contact us either by mentioning
**@plentymarkets-plugin-core** in the PR's conversation or by opening a new thread in the forum. 

## Branch naming

The branches you create should follow the following naming convention:
- Branches for bug fixes should always begin with the prefix **fix** and a slash, e.g. "fix/disabled_button".
- Branches for features should always begin with the prefix **feature** and a slash, e.g. "feature/confirmation_overlay".

## Resources

You can find our developers documentation [here](https://developers.plentymarkets.com/en-gb/plentydevtool/main/plentydevtool-introduction.html).
