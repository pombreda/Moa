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
# Empty - use this to create a new makefile
################################################################################
# Main target
maintarget: not doing anything

################################################################################
# Help
moa_ids += empty
moa_title_empty = 
moa_description_empty = 

################################################################################
# Variable definition (non obligatory ones)

################################################################################
# Variable help definition

################################################################################
# moa definitions
#
#targets that the enduser might want to use
moa_targets += 
#varables that NEED to be defined
moa_must_define += 
#varaibles that might be defined
moa_may_define += 		
#Include base moa code - does variable checks & generates help
ifndef dont_include_moabase
	include $(shell echo $$MOABASE)/template/moaBase.mk
endif

################################################################################
# End of the generic part - from here on you're on your own :)
