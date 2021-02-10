#!/bin/bash

# Copyright 2021 Markus Leupold-Löwenthal
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

# calculate average color of assets and rename the file
# requires ImageMagick

while (( "$#" )); do
  FILE="$1"

  EXT="${FILE##*.}"
  NAME="${FILE%.*}"

  # detect color
  COLOR=`convert "$FILE" -resize 1x1 txt:- | grep -Po "#[[:xdigit:]]{6}"`
  COLOR=${COLOR#\#}

  # remove color info
  NAME="${NAME%%.[a-fA-F0-9][a-fA-F0-9][a-fA-F0-9][a-fA-F0-9][a-fA-F0-9][a-fA-F0-9]}"

  mv "$FILE" "$NAME.$COLOR.$EXT"
  shift
done
