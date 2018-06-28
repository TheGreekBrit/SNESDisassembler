import struct
import misc.instructions as opcodes
import misc.helper as Helper

rom = open('yoshi.sfc', 'rb')
output = open('data', 'wa')


address = 0x000000

read_size = 1

#current bytes
byte = -1

def read_line(rom_pc):
	global address
	line = '${0:06x} '.format(address)
	read_size = 1
	
	byte = Helper.read_bytes(rom_pc, read_size)
	op = Helper.get_opcode(int(byte, 10))
	
	if op['length'] == 1:
		return line + op['opcode']
	
	#get data bytes
	data = Helper.read_bytes(rom_pc, op['length'] - 1)
	#print data
	
	line += '%s %s%s' % (op['opcode'], op['prefix'], data)
	
	address += op['length']
	return line

print read_line(rom)
print read_line(rom)
print read_line(rom)
print read_line(rom)
print read_line(rom)
print read_line(rom)
print read_line(rom)
print read_line(rom)
print read_line(rom)

print read_line(rom)
print read_line(rom)
print read_line(rom)
print read_line(rom)
print read_line(rom)
print read_line(rom)
print read_line(rom)



"""
	while byte != '':
		arg_bytes_hex = None
		byte_hex = struct.unpack('<B', byte)[0]
		
		# get opcode and length
		op = Helper.get_opcode(byte_hex)
		bytecount = op['length']
		# get tuple containing 0-3
		if bytecount > 1:
			val = get_bytes(rom, bytecount)
			
		else:
			full_line = (op['opcode'], null, null, null)

        if(op['length'] == 2):
            arg_bytes = rom.read(1)
            arg_bytes_hex = struct.unpack('<B', arg_bytes)[0]
            arg = '{0:02x}'.format(arg_bytes_hex)
        elif(op['length'] == 3):
            arg_bytes = rom.read(2)
            arg_bytes_hex = struct.unpack('<BB', arg_bytes)
            arg_bytes_hex = int(''.join(str(i) for i in arg_bytes_hex))
            arg = '{0:04x}'.format(arg_bytes_hex)
        elif(op['length'] == 4):
            arg_bytes = rom.read(3)
            arg_bytes_hex = struct.unpack('<BBB', arg_bytes)

            arg_bytes_hex = int(''.join(str(i) for i in arg_bytes_hex))
            arg = '{0:06x}'.format(arg_bytes_hex)

        #output.write('${0:06x}: '.format(address) + hex(byte_hex[0]))
        #print '${0:06x}: '.format(address) + hex(byte_hex[0])
        if arg_bytes_hex != None:
            print '${0:06x}: '.format(address) + op['opcode'] + ' ' + op['prefix'] + arg
        else:
            print '${0:06x}: '.format(address) + op['opcode']

        byte = rom.read(1)
        address += op['length']
finally:
    rom.close()
"""
