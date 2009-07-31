#
#    Copyright 2009 Mark Fiers
#
#    This file is part of Moa 
#
#    Moa is free software: you can redistribute it and/or modify
#    it under the terms of the GNU General Public License as published by
#    the Free Software Foundation, either version 3 of the License, or
#    (at your option) any later version.
#
#    Moa is distributed in the hope that it will be useful,
#    but WITHOUT ANY WARRANTY; without even the implied warranty of
#    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
#    GNU General Public License for more details.
#
#    You should have received a copy of the GNU General Public License
#    along with Moa.  If not, see <http://www.gnu.org/licenses/>.
#
#    See: http://github.com/mfiers/Moa/
#
moa_ids += create.gbrowse.db

#create.gbrowse.db_help = Create a gbrowse database
moa_title_create.gbrowse.db = Create a gbrowse database
moa_description_create.gbrowse.db = Create a gbrowse database
moa_must_define += gbrowse_user gbrowse_db
gbrowse_user_help = gbrowse db user
gbrowse_db_help = gbrowse db

include $(shell echo $$MOABASE)/template/moaBase.mk

.PHONY: create.gbrowse.db_prepare
create.gbrowse.db_prepare:

create.gbrowse.db:
	bp_seqfeature_load.pl -d $(gbrowse_db) -u $(gbrowse_user) -c
	echo "Add some columns, for use by the frontend"
	mysql -u$(gbrowse_user) \
	      -e 'ALTER TABLE $(gbrowse_db).name ADD COLUMN `pid` int(10) NOT NULL AUTO_INCREMENT, ADD PRIMARY KEY (`pid`);'
	mysql -u$(gbrowse_user) \
	      -e 'ALTER TABLE $(gbrowse_db).attribute ADD COLUMN `pid` int(10) NOT NULL AUTO_INCREMENT, ADD PRIMARY KEY (`pid`);'
	mysql -u$(gbrowse_user) \
	      -e 'ALTER TABLE $(gbrowse_db).parent2child ADD COLUMN `pid` int(10) NOT NULL AUTO_INCREMENT, ADD PRIMARY KEY (`pid`);'
	touch create.gbrowse.db

.PHONY: create.gbrowse.db_post
create.gbrowse.db_post:

.PHONY: create.gbrowse.db_clean
create.gbrowse.db_clean:
	bp_seqfeature_load.pl -d $(gbrowse_db) -u $(gbrowse_user) -c
	echo "Add some columns, for use by the frontend"
	mysql -u$(gbrowse_user) \
	      -e 'ALTER TABLE $(gbrowse_db).name ADD COLUMN `pid` int(10) NOT NULL AUTO_INCREMENT, ADD PRIMARY KEY (`pid`);'
	mysql -u$(gbrowse_user) \
	      -e 'ALTER TABLE $(gbrowse_db).attribute ADD COLUMN `pid` int(10) NOT NULL AUTO_INCREMENT, ADD PRIMARY KEY (`pid`);'
	mysql -u$(gbrowse_user) \
	      -e 'ALTER TABLE $(gbrowse_db).parent2child ADD COLUMN `pid` int(10) NOT NULL AUTO_INCREMENT, ADD PRIMARY KEY (`pid`);'
	-rm create.gbrowse.db