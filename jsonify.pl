#!/opt/local/bin/perl -w

use strict;
use XML::Twig;
use JSON;

my $twig = XML::Twig->new(
    twig_handlers => {
        row => \&jsonify_row
    }
);
$twig->parsefile('data/RePORTER_PRJ_X_FY2014_170.xml');
#my $root = $twig->root;
#my @rows = $root->children('row');
#foreach my $row (@rows) {
sub jsonify_row {
    my ($t, $row) = @_;
    my $app_id = $row->first_child('APPLICATION_ID')->text;
    my $title = $row->first_child('PROJECT_TITLE')->text;
    my @term_elems = $row->first_child('PROJECT_TERMSX')->children('TERM');
    my @terms = ();
    for my $term_elem (@term_elems) {
        push @terms, $term_elem->text;
    }
    my $json = encode_json {
        application_id => $app_id,
        title => $title,
        terms => \@terms
    };
    print $json . "\n";
}
