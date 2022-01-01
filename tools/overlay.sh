#!/bin/bash

# Copyright 2021-2022 Markus Leupold-Löwenthal
#
# This file is part of FreeBeeGee.
#
# FreeBeeGee is free software: you can redistribute it and/or modify it under the
# terms of the GNU Affero General Public License as published by the Free
# Software Foundation, either version 3 of the License, or (at your option) any
# later version.
#
# FreeBeeGee is distributed in the hope that it will be useful, but WITHOUT ANY
# WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR
# A PARTICULAR PURPOSE. See the GNU Affero General Public License for more details.
#
# You should have received a copy of the GNU Affero General Public License
# along with FreeBeeGee. If not, see <https://www.gnu.org/licenses/>.

# Create color variants of the area*.svg overlays into your /tmp folder.

colors=('#0d0d0d' '#3f8efc' '#0f956a' '#40bfbf' '#cc2936' '#bf40bf' '#ff6700' '#f2e4be')

for size in 1 2 3 4 5 ; do
  for color in 0 1 2 3 4 5 6 7 ; do
    side=`printf "%01d" $((color+1))`
    cat "area.${size}x${size}x0.svg" | sed -e "s/#bf40bf/${colors[$color]}/g" > "/tmp/area.${size}x${size}x${side}.svg"
  done
done
