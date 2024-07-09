#!/usr/bin/env python
# -*- coding: utf-8 -*-
# Copyright (c) 2021 LG Electronics Inc.
# SPDX-License-Identifier: Apache-2.0

import logging
import pkg_resources
from lastversion import lastversion


def check_version(pkg_version="", main_package_name=""):
    logger = logging.getLogger("FOSSLight")

    try:
        has_update = lastversion.has_update(repo=main_package_name, at='pip', current_version=pkg_version)
        if has_update:
            print('Newer version is available')
        else:
            print('You are using the latest version')
    except TypeError:
        logger.error('Cannot check the lastest version on PIP')
        logger.error('You could use already installed version\n')
    except Exception as error:
        logger.error('Cannot check the latest version:' + str(error))


def main():
    pkg_version = pkg_resources.get_distribution("fosslight_scanner").version
    check_version(pkg_version, "fosslight_scanner")


if __name__ == "__main__":
    main()
