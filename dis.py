import struct
from instructions import instructions

rom = open('yoshi.sfc', 'rb')
output = open('data', 'wa')

try:
    address = 0x000000
    byte = rom.read(1)
    while byte != '':
        arg_bytes_hex = None
        byte_hex = struct.unpack('<B', byte)[0]

        op = instructions[byte_hex]

        if(op['length'] == 2):
            arg_bytes = rom.read(1)
            arg_bytes_hex = struct.unpack('<B', arg_bytes)[0]
            arg = '${0:02x}'.format(arg_bytes_hex)
        elif(op['length'] == 3):
            arg_bytes = rom.read(2)
            arg_bytes_hex = struct.unpack('<BB', arg_bytes)
            arg_bytes_hex = int(''.join(str(i) for i in arg_bytes_hex))
            arg = '${0:04x}'.format(arg_bytes_hex)
        elif(op['length'] == 4):
            arg_bytes = rom.read(3)
            arg_bytes_hex = struct.unpack('<BBB', arg_bytes)

            arg_bytes_hex = int(''.join(str(i) for i in arg_bytes_hex))
            arg = '${0:06x}'.format(arg_bytes_hex)

        #output.write('${0:06x}: '.format(address) + hex(byte_hex[0]))
        #print '${0:06x}: '.format(address) + hex(byte_hex[0])
        if arg_bytes_hex != None:
            print '${0:06x}: '.format(address) + op['opcode'] + ' ' + arg
        else:
            print '${0:06x}: '.format(address) + op['opcode']

        byte = rom.read(1)
        address += op['length']
finally:
    rom.close()