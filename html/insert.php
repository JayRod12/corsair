<!-- <?php
    $db_conn = pg_connect("host=db.doc.ic.ac.uk port=5432 dbname=g1527124_u user=g1527124_u password=rpia6dfn33")
                     or die('Could not connect: ' . pg_last_error());
    $query  = "SELECT * FROM scores";
    $result = pg_query($db_conn,$query) or die('Query failed: ' . pg_last_error());

    //PRINTING RESULTS IN HTML
    echo '<table>
    <tr>
    <td>Name</td>
    <td>Score</td>
    </tr>';


  while($row = pg_fetch_array($result)){
  echo "<tr>";
  echo "<td>" . $row['Name'] . "</td>";
  echo "<td>" . $row['Score'] . "</td>";
  echo "</tr>";
  }
  echo '</table>';


?> -->

<?php

$host = 'db.doc.ic.ac.uk';
$port = '5432';
$database = 'g1527124_u';
$user = 'g1527124_u';
$password = 'rpia6dfn33';

$connectString = 'host=' . $host . ' port=' . $port . ' dbname=' . $database .
	' user=' . $user . ' password=' . $password;


$link = pg_connect ($connectString);
if (!$link)
{
	die('Error: Could not connect: ' . pg_last_error());
}


$query = 'select * from scores';

$result = pg_query($query);

$i = 0;
echo '<html><body><table><tr>';
while ($i < pg_num_fields($result))
{
	$fieldName = pg_field_name($result, $i);
	echo '<td>' . $fieldName . '</td>';
	$i = $i + 1;
}
echo '</tr>';
$i = 0;

while ($row = pg_fetch_row($result))
{
	echo '<tr>';
	$count = count($row);
	$y = 0;
	while ($y < $count)
	{
		$c_row = current($row);
		echo '<td>' . $c_row . '</td>';
		next($row);
		$y = $y + 1;
	}
	echo '</tr>';
	$i = $i + 1;
}
pg_free_result($result);

echo '</table></body></html>';
?>
