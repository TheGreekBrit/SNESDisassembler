import struct
import instructions as ops

def get_opcode(byte_hex):
	try:
		op = ops.instructions[byte_hex]
		return op
	except KeyError as e:
		print 'bad op: %s' % str(byte_hex)

#returns tuple of bytes from the rom's PC
def read_bytes(rom, byte_count=1):
	bytes_hex = []
	
	bytes_raw = rom.read(byte_count)
	bytes_hex.append(struct.unpack('>' + 'B' * byte_count, bytes_raw)[0])
	arrange_fmt = '{0:0%s}' % str(byte_count*2)
	bytes_arranged = arrange_fmt.format(int(''.join(str(i) for i in bytes_hex)))
	#print 'arranged: ' + bytes_arranged

	#print hex(byte_hex)
	#print ops.instructions[byte_hex]
	return bytes_arranged
	
	
